import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BODY, BODY_DARK, ROOT, buildStylesheet } from '../../src/shared/stylesheet.ts'
import { FILL_KEYS, FILL_TOKENS, MENU_TOKENS } from '../../src/shared/tokens.ts'

type Specificity = [number, number, number]

/** Specificity of one complex selector, for the selector grammar the plugin uses. */
function specificity(selector: string): Specificity {
  const result: Specificity = [0, 0, 0]
  let rest = selector
  const add = (other: Specificity): void => {
    result[0] += other[0]
    result[1] += other[1]
    result[2] += other[2]
  }
  while (rest.length > 0) {
    const not = /^:(?:not|is)\(/.exec(rest)
    if (not) {
      let depth = 1
      let index = not[0].length
      for (; index < rest.length && depth > 0; index++) {
        if (rest[index] === '(') depth++
        else if (rest[index] === ')') depth--
      }
      const inner = rest.slice(not[0].length, index - 1)
      const max = inner
        .split(',')
        .map(part => specificity(part.trim()))
        .sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0]
      if (max) add(max)
      rest = rest.slice(index)
      continue
    }
    const match =
      /^#[\w-]+/.exec(rest) ??
      /^\.[\w-]+/.exec(rest) ??
      /^\[[^\]]*\]/.exec(rest) ??
      /^::[\w-]+/.exec(rest) ??
      /^:[\w-]+/.exec(rest) ??
      /^[a-z][\w-]*/i.exec(rest) ??
      /^[\s>+~*]+/.exec(rest)
    assert.ok(match, `cannot read selector at: ${rest}`)
    const token = match[0]
    if (token.startsWith('#')) add([1, 0, 0])
    else if (token.startsWith('.') || token.startsWith('[') || (token.startsWith(':') && !token.startsWith('::')))
      add([0, 1, 0])
    else if (token.startsWith('::') || /^[a-z]/i.test(token)) add([0, 0, 1])
    rest = rest.slice(token.length)
  }
  return result
}

function compare(a: Specificity, b: Specificity): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]
}

interface Rule {
  selectors: string[]
  body: string
}

/** Flatten the sheet into style rules, descending into conditional groups. */
function rules(css: string): Rule[] {
  const out: Rule[] = []
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let index = 0
  const read = (end: number): void => {
    while (index < end) {
      const open = text.indexOf('{', index)
      if (open === -1 || open >= end) return
      const prelude = text.slice(index, open).trim()
      let depth = 1
      let close = open + 1
      for (; close < text.length && depth > 0; close++) {
        if (text[close] === '{') depth++
        else if (text[close] === '}') depth--
      }
      if (prelude.startsWith('@media') || prelude.startsWith('@supports')) {
        index = open + 1
        read(close - 1)
      } else if (!prelude.startsWith('@')) {
        out.push({ selectors: prelude.split(',').map(part => part.trim()), body: text.slice(open + 1, close - 1) })
      }
      index = close
    }
  }
  read(text.length)
  return out
}

const css = buildStylesheet()
const all = rules(css)

describe('buildStylesheet', () => {
  it('can be embedded in HTML', () => {
    assert.doesNotMatch(css, /<\/style/i)
    assert.doesNotMatch(css, /<!--|-->/)
  })

  it('never uses !important', () => {
    assert.doesNotMatch(css, /!important/i)
  })

  it('has balanced braces and parentheses', () => {
    const count = (char: string): number => css.split(char).length - 1
    assert.equal(count('{'), count('}'))
    assert.equal(count('('), count(')'))
  })

  it('scopes every rule under the root attribute', () => {
    assert.ok(all.length > 20)
    for (const rule of all) {
      for (const selector of rule.selectors) assert.ok(selector.startsWith(ROOT), selector)
    }
  })

  it('registers the per-surface properties at top level', () => {
    const media = css.indexOf('@media')
    for (const name of ['--glassui-lx', '--glassui-ly', '--glassui-light', '--glassui-pane', '--glassui-pane-size']) {
      const at = css.indexOf(`@property ${name} `)
      assert.ok(at !== -1 && at < media, name)
    }
    assert.match(css, /@property --glassui-lx \{[^}]*inherits: false/)
  })

  it('only applies to screens outside forced-colors mode', () => {
    assert.match(css, /@media screen and \(forced-colors: none\) \{/)
  })

  it('overrides DSH tokens with more specificity than DSH’s own rules', () => {
    // DSH's most specific token rule: html[data-platform='darwin'] body[data-ds-dark-theme].
    const upstream: Specificity = [0, 2, 2]
    for (const rule of all) {
      if (!/--dsw-[\w-]+\s*:/.test(rule.body)) continue
      for (const selector of rule.selectors) {
        const value = specificity(selector)
        if (selector === BODY || selector === `${BODY} *`) {
          assert.deepEqual(value, [0, 2, 1], selector)
          continue
        }
        assert.ok(compare(value, upstream) > 0, `${selector} → ${value.join(',')}`)
      }
    }
  })

  it('declares the dark palette more specifically than the light one', () => {
    assert.ok(compare(specificity(BODY_DARK), specificity(BODY)) > 0)
    assert.ok(compare(specificity(BODY_DARK), [0, 2, 2]) > 0)
  })

  it('mixes glass for every watched fill', () => {
    for (const key of FILL_KEYS) {
      const rule = all.find(candidate =>
        candidate.selectors.some(selector => selector.endsWith(`[data-glassui-fill="${key}"]`)),
      )
      assert.ok(rule, key)
      assert.match(rule.body, new RegExp(`${FILL_TOKENS[key]}: color-mix\\(in srgb, var\\(--glassui-src-${key}\\)`))
    }
  })

  it('captures each fill on <body> before surfaces override it', () => {
    const body = all.find(
      rule =>
        rule.selectors.length === 1 && rule.selectors[0]?.startsWith(BODY) && rule.body.includes('--glassui-src-'),
    )
    assert.ok(body)
    for (const key of FILL_KEYS) assert.ok(body.body.includes(`--glassui-src-${key}: var(${FILL_TOKENS[key]});`), key)
  })

  it('restyles DSH menus through their material tokens only', () => {
    assert.ok(css.includes(`${MENU_TOKENS.filter}: var(--glassui-filter);`))
    assert.ok(css.includes(`${MENU_TOKENS.fill}:`))
  })

  it('quotes every url() and keeps data URLs encoded', () => {
    const quoted = [...css.matchAll(/url\("([^"]*)"\)/g)].map(match => match[1] ?? '')
    assert.ok(quoted.length >= 2)
    for (const value of quoted) assert.match(value, /^data:image\/svg\+xml,[^"<>#\n\r]*$/, value.slice(0, 80))
    const unquoted = css.replace(/"[^"]*"/g, '""')
    assert.doesNotMatch(unquoted, /url\((?!"")/)
  })

  it('is stable between calls', () => {
    assert.equal(buildStylesheet(), css)
  })
})
