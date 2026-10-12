// The built client half on a DSH-like page in Chromium.
import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { closeBrowser, openFixture, settle, surfaces } from './fixture.mjs'

after(closeBrowser)

const FOOTPRINT = [
  'data-glassui',
  'data-glassui-sidebar',
  'data-glassui-wallpaper',
  'data-glassui-highlights',
  'data-glassui-raw',
  'data-glassui-surface',
  'data-glassui-fill',
  'data-glassui-flat',
  'data-glassui-paint',
  'data-glassui-float',
  'data-glassui-lens',
  'data-glassui-owned',
]
  .map(name => `[${name}]`)
  .join(',')

/** Read a computed color: `rgb()`, `rgba()` or `color(srgb …)` (what color-mix() serializes to). */
function color(value) {
  const legacy = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(value)
  if (legacy) return { r: +legacy[1], g: +legacy[2], b: +legacy[3], a: legacy[4] === undefined ? 1 : +legacy[4] }
  const srgb = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value)
  if (srgb) {
    const channel = text => Math.round(Number(text) * 255)
    return { r: channel(srgb[1]), g: channel(srgb[2]), b: channel(srgb[3]), a: srgb[4] === undefined ? 1 : +srgb[4] }
  }
  throw new Error(`unexpected color ${value}`)
}

/** Computed styles that matter for the look, for every fixture element. */
function snapshot(page) {
  return page.evaluate(() => {
    const out = {}
    for (const element of [document.documentElement, document.body, ...document.querySelectorAll('[id]')]) {
      const style = getComputedStyle(element)
      out[element.id || element.tagName] = [
        style.backgroundColor,
        style.backgroundImage,
        style.boxShadow,
        style.backdropFilter,
        style.margin,
        style.clipPath,
      ].join(' | ')
    }
    return out
  })
}

describe('discovery', () => {
  it('finds every DSH surface by its tokens and nothing else', async () => {
    const { page, errors, close } = await openFixture()
    try {
      const found = await surfaces(page)
      assert.equal(found.frame?.kind, 'backdrop')
      assert.deepEqual(found.sidebar, { kind: 'sidebar', fill: 'sidebar', flat: false, float: true, lens: null })
      assert.equal(found['sidebar-inner']?.flat, true)
      assert.equal(found.composer?.kind, 'composer')
      assert.equal(found.dialog?.kind, 'panel')
      assert.equal(found.menu?.kind, 'menu')
      assert.equal(found.toast?.kind, 'smoke')
      assert.equal(found.code, undefined, 'reserved tokens are never glass')
      assert.equal(found['flat-card'], undefined, 'a card without elevation is not a panel')
      assert.equal(found['ignored-dialog'], undefined, 'data-glassui-ignore is respected')
      const diagnostics = await page.evaluate(() => window.__fixture.debug().diagnostics())
      assert.equal(diagnostics.running, true)
      assert.deepEqual(diagnostics.missingTokens, [])
      assert.deepEqual(diagnostics.ambiguousTokens, [])
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('turns surfaces into glass and paints the wallpaper', async () => {
    const { page, close } = await openFixture()
    try {
      const styles = await page.evaluate(() => {
        const read = id => getComputedStyle(document.getElementById(id))
        return {
          root: document.documentElement.getAttribute('data-glassui'),
          wallpaper: document.documentElement.getAttribute('data-glassui-wallpaper'),
          composer: read('composer').backgroundColor,
          composerFilter: read('composer').backdropFilter,
          frame: read('frame').backgroundColor,
          inner: read('sidebar-inner').backgroundColor,
          sidebarClip: read('sidebar').clipPath,
          code: read('code').backgroundColor,
        }
      })
      assert.equal(styles.root, 'on')
      assert.equal(styles.wallpaper, 'bay')
      const composer = color(styles.composer)
      assert.ok(composer.r >= 252 && composer.g >= 252 && composer.b >= 252, styles.composer)
      assert.ok(composer.a > 0.1 && composer.a < 0.9, `translucent: ${styles.composer}`)
      assert.match(styles.composerFilter, /blur|url/)
      assert.equal(color(styles.frame).a, 0, 'layout panes become transparent')
      assert.equal(color(styles.inner).a, 0, 'nested surfaces do not stack glass')
      assert.match(styles.sidebarClip, /^inset\(8px round 18px\)$/)
      assert.equal(styles.code, 'rgb(245, 246, 247)', 'reserved tokens keep their exact value')
    } finally {
      await close()
    }
  })

  it('follows DOM changes', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => {
        const toast = document.createElement('div')
        toast.id = 'late-toast'
        toast.className = 'toast'
        toast.style.top = '320px'
        document.body.append(toast)
        document.getElementById('flat-card').style.boxShadow = 'var(--dsw-elevation-panel)'
        const card = document.getElementById('flat-card')
        card.className = 'flat-card raised'
      })
      await settle(page)
      let found = await surfaces(page)
      assert.equal(found['late-toast']?.kind, 'smoke')
      await page.evaluate(() => document.getElementById('toast').remove())
      await settle(page)
      found = await surfaces(page)
      assert.equal(found.toast, undefined)
    } finally {
      await close()
    }
  })

  it('follows a palette switch', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
      await settle(page, 10)
      const found = await surfaces(page)
      assert.equal(found.composer?.kind, 'composer')
      assert.equal(found.dialog?.kind, 'panel')
      const composer = await page.evaluate(() => getComputedStyle(document.getElementById('composer')).backgroundColor)
      const glass = color(composer)
      assert.ok(glass.r < 48 && glass.g < 48 && glass.b < 48 && glass.a < 0.9, `dark glass, got ${composer}`)
      const diagnostics = await page.evaluate(() => window.__fixture.debug().diagnostics())
      assert.deepEqual(diagnostics.ambiguousTokens, [])
    } finally {
      await close()
    }
  })
})

describe('coexistence', () => {
  it('lets another plugin’s token overrides win', async () => {
    const { page, close } = await openFixture()
    try {
      // What DSH's ThemePresenter does for ctx.theme.overrideTokens: inline values on <body>.
      await page.evaluate(() => document.body.style.setProperty('--dsw-alias-bg-layer-2', 'rgb(200 0 0)'))
      await settle(page, 10)
      const found = await surfaces(page)
      assert.equal(found.dialog?.kind, 'panel')
      const dialog = await page.evaluate(() => getComputedStyle(document.getElementById('dialog')).backgroundColor)
      const glass = color(dialog)
      assert.deepEqual([glass.r, glass.g, glass.b], [200, 0, 0], `the override shows through the glass, got ${dialog}`)
      assert.ok(glass.a < 1)
      const card = await page.evaluate(() => getComputedStyle(document.getElementById('flat-card')).backgroundColor)
      assert.equal(card, 'rgb(200, 0, 0)')
    } finally {
      await close()
    }
  })

  it('leaves elements under an exclusion selector alone', async () => {
    const { page, close } = await openFixture({ config: { exclude: '#dialog, .menu' } })
    try {
      const found = await surfaces(page)
      assert.equal(found.dialog, undefined)
      assert.equal(found.menu, undefined)
      assert.equal(found.composer?.kind, 'composer')
    } finally {
      await close()
    }
  })

  it('styles another plugin’s element that opts in with data-glassui-material', async () => {
    const { page, close } = await openFixture({
      extraBody:
        '<div id="opt-in" data-glassui-material="dense" style="position:fixed;left:10px;top:10px;width:50px;height:50px;background:#fff;box-shadow:var(--dsw-elevation-panel)"></div>',
    })
    try {
      const found = await surfaces(page)
      assert.equal(found['opt-in'], undefined, 'never classified')
      const style = await page.evaluate(() => getComputedStyle(document.getElementById('opt-in')))
      assert.ok(style)
      const filter = await page.evaluate(() => getComputedStyle(document.getElementById('opt-in')).backdropFilter)
      assert.match(filter, /blur/)
    } finally {
      await close()
    }
  })
})

describe('settings', () => {
  it('applies live edits from DSH’s settings form', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => window.__fixture.form.update({ tint: 80, sidebar: 'docked', wallpaper: 'none' }))
      await settle(page)
      const state = await page.evaluate(() => ({
        tint: document.documentElement.style.getPropertyValue('--glassui-t'),
        sidebar: document.documentElement.getAttribute('data-glassui-sidebar'),
        wallpaper: document.documentElement.getAttribute('data-glassui-wallpaper'),
        clip: getComputedStyle(document.getElementById('sidebar')).clipPath,
      }))
      assert.deepEqual(state, { tint: '0.8', sidebar: 'docked', wallpaper: null, clip: 'none' })
    } finally {
      await close()
    }
  })

  it('turns off without leaving a trace', async () => {
    const stock = await openFixture({ plugin: false })
    const baseline = await snapshot(stock.page)
    await stock.close()

    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => window.__fixture.form.update({ enabled: false }))
      await settle(page)
      assert.equal(await page.evaluate(selector => document.querySelectorAll(selector).length, FOOTPRINT), 0)
      assert.deepEqual(await snapshot(page), baseline)
      await page.evaluate(() => window.__fixture.form.update({ enabled: true }))
      await settle(page)
      assert.equal((await surfaces(page)).composer?.kind, 'composer', 'and back on')
    } finally {
      await close()
    }
  })

  it('cleans up completely when DSH disposes the plugin', async () => {
    const stock = await openFixture({ plugin: false })
    const baseline = await snapshot(stock.page)
    await stock.close()

    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => window.__fixture.dispose())
      await settle(page)
      assert.equal(await page.evaluate(selector => document.querySelectorAll(selector).length, FOOTPRINT), 0)
      assert.equal(await page.evaluate(() => '__DSH_GLASSUI_DEBUG__' in window), false)
      assert.deepEqual(await snapshot(page), baseline)
    } finally {
      await close()
    }
  })

  it('starts from the boot settings without a settings form', async () => {
    const { page, close } = await openFixture({ start: false, config: { tint: 10 } })
    try {
      await page.evaluate(() => window.__fixture.start({ form: false }))
      await settle(page)
      assert.equal(await page.evaluate(() => window.__fixture.debug().settings().tint), 10)
      assert.equal((await surfaces(page)).composer?.kind, 'composer')
    } finally {
      await close()
    }
  })
})

describe('performance', () => {
  it('skips message content and keeps up with a streaming transcript', async () => {
    const { page, close } = await openFixture()
    try {
      const result = await page.evaluate(async () => {
        const chat = document.getElementById('chat')
        const before = window.__fixture.debug().diagnostics().scans
        let rows = 0
        // 4,000 messages arriving 200 per frame, each a row wrapping rendered Markdown, like DSH's transcript.
        for (let batch = 0; batch < 20; batch++) {
          const fragment = document.createDocumentFragment()
          for (let index = 0; index < 200; index++) {
            const row = document.createElement('div')
            row.innerHTML =
              '<div data-markdown-variant="message"><p>Line <b>bold</b> <code>code</code></p>' +
              '<ul><li>a</li><li>b</li></ul><pre><code>x = 1</code></pre><table><tr><td>1</td></tr></table></div>'
            fragment.append(row)
            rows++
          }
          chat.append(fragment)
          await window.__fixture.frames(1)
        }
        await window.__fixture.frames(30)
        const after = window.__fixture.debug().diagnostics().scans
        return {
          rows,
          nodes: chat.querySelectorAll('*').length,
          inspected: after.inspected - before.inspected,
          totalMs: after.totalMs - before.totalMs,
        }
      })
      assert.ok(result.nodes > 50_000, `${result.nodes} nodes`)
      // Rows are inspected; the Markdown inside them never is.
      assert.ok(result.inspected <= result.rows + 50, `inspected ${result.inspected} of ${result.nodes} nodes`)
      // Generous bound for slow CI runners; includes the style recalculation the browser needs anyway.
      assert.ok(result.totalMs / result.rows < 0.25, `${(result.totalMs / result.rows).toFixed(3)} ms per message`)
      assert.equal((await surfaces(page)).composer?.kind, 'composer')
    } finally {
      await close()
    }
  })
})
