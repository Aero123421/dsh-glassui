import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { lensRule, nudgeRules } from '../../src/client/engine/sheet.ts'

describe('nudgeRules', () => {
  it('is empty without nudges', () => {
    assert.equal(nudgeRules(new Map(), false), '')
  })

  it('targets one palette and steps aside while the engine reads raw values', () => {
    const light = nudgeRules(new Map([['base', { r: 255, g: 255, b: 254, a: 1 }]]), false)
    assert.equal(
      light,
      ':root[data-glassui] body:not([data-ds-dark-theme]):not([data-glassui-raw]):not([data-glassui-excluded]) {\n  --dsw-alias-bg-base: rgb(255 255 254);\n}',
    )
    const dark = nudgeRules(new Map([['input', { r: 30, g: 30, b: 33, a: 0.5 }]]), true)
    assert.match(
      dark,
      /^:root\[data-glassui\] body\[data-ds-dark-theme\]:not\(\[data-glassui-raw\]\):not\(\[data-glassui-excluded\]\) \{/,
    )
    assert.match(dark, /--dsw-specific-input-major: rgb\(30 30 33 \/ 0\.5\);/)
  })
})

describe('lensRule', () => {
  it('applies the numbered filter to that surface only', () => {
    const rule = lensRule(7)
    assert.match(rule, /\[data-glassui-lens="7"\]/)
    assert.match(rule, /backdrop-filter: url\(#glassui-lens-7\)/)
    assert.match(rule, /:not\(\[data-glassui-flat\]\)/)
  })
})
