import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  BACKDROP_AREA,
  MIN_FLOAT_WIDTH,
  PANE_AREA,
  classify,
  elevationOf,
  type ElementSample,
  type Signatures,
} from '../../src/client/engine/classify.ts'
import type { FillKey } from '../../src/shared/tokens.ts'

const FILLS: Record<string, FillKey> = {
  'rgb(255, 255, 254)': 'base',
  'rgb(255, 255, 253)': 'input',
  'rgb(247, 248, 249)': 'sidebar',
  'rgb(255, 254, 255)': 'layer2',
  'rgb(30, 30, 31)': 'toast',
  'rgb(30, 31, 30)': 'tooltip',
  'rgb(254, 255, 255)': 'floating',
  'rgb(249, 250, 250)': 'code',
  'rgb(249, 251, 251)': 'codeBanner',
}

const signatures: Signatures = {
  fills: new Map(Object.entries(FILLS)),
  elevation: { panel: 'rgba(1, 0, 61, 0)', prominent: 'rgba(1, 0, 62, 0)', soft: 'rgba(1, 0, 63, 0)' },
  menuFilter: 'blur(20px) saturate(1.8)',
}

function sample(overrides: Partial<ElementSample>): ElementSample {
  return {
    background: 'rgba(0, 0, 0, 0)',
    backgroundImage: 'none',
    boxShadow: 'none',
    backdropFilter: 'none',
    area: 0.05,
    width: 300,
    managed: false,
    ...overrides,
  }
}

const panelShadow = 'rgba(0, 0, 0, 0.1) 0px 10px 28px -10px, rgba(1, 0, 61, 0) 0px 0px 0px 0px'

describe('elevationOf', () => {
  it('finds the tier by its sentinel color', () => {
    assert.equal(elevationOf(panelShadow, signatures.elevation), 'panel')
    assert.equal(elevationOf('rgba(1, 0, 62, 0) 0px 0px 0px 0px', signatures.elevation), 'prominent')
    assert.equal(elevationOf('rgba(0, 0, 0, 0.1) 0px 1px 2px 0px', signatures.elevation), undefined)
    assert.equal(elevationOf('none', signatures.elevation), undefined)
  })

  it('ignores tiers whose sentinel could not be read', () => {
    assert.equal(elevationOf(panelShadow, { ...signatures.elevation, panel: '' }), undefined)
  })
})

describe('classify', () => {
  it('ignores unknown fills and transparent elements', () => {
    assert.equal(classify(sample({}), signatures), undefined)
    assert.equal(classify(sample({ background: 'rgb(1, 2, 3)', boxShadow: panelShadow }), signatures), undefined)
  })

  it('never touches elements styled through the public material attribute', () => {
    assert.equal(classify(sample({ background: 'rgb(255, 255, 253)', managed: true }), signatures), undefined)
  })

  it('finds the sidebar and lets a plain, wide one float', () => {
    assert.deepEqual(classify(sample({ background: 'rgb(247, 248, 249)', width: 280 }), signatures), {
      kind: 'sidebar',
      fill: 'sidebar',
      paint: true,
      float: true,
    })
    const rail = classify(sample({ background: 'rgb(247, 248, 249)', width: MIN_FLOAT_WIDTH - 1 }), signatures)
    assert.equal(rail?.float, false)
    const shadowed = classify(sample({ background: 'rgb(247, 248, 249)', boxShadow: panelShadow }), signatures)
    assert.equal(shadowed?.float, false)
  })

  it('turns pane-sized surfaces into transparent backdrops', () => {
    assert.equal(
      classify(sample({ background: 'rgb(247, 248, 249)', area: PANE_AREA + 0.01 }), signatures)?.kind,
      'backdrop',
    )
    assert.equal(classify(sample({ background: 'rgb(255, 255, 253)', area: 0.9 }), signatures)?.kind, 'backdrop')
    assert.equal(
      classify(sample({ background: 'rgb(255, 255, 254)', area: BACKDROP_AREA }), signatures)?.kind,
      'backdrop',
    )
  })

  it('finds the composer', () => {
    assert.deepEqual(classify(sample({ background: 'rgb(255, 255, 253)' }), signatures), {
      kind: 'composer',
      fill: 'input',
      paint: true,
      float: false,
    })
  })

  it('makes toasts and tooltips smoke, but never a full-screen one', () => {
    assert.equal(classify(sample({ background: 'rgb(30, 30, 31)' }), signatures)?.kind, 'smoke')
    assert.equal(classify(sample({ background: 'rgb(30, 31, 30)' }), signatures)?.kind, 'smoke')
    assert.equal(classify(sample({ background: 'rgb(30, 30, 31)', area: 0.8 }), signatures), undefined)
  })

  it('needs an elevation tier for panels', () => {
    assert.equal(classify(sample({ background: 'rgb(255, 254, 255)' }), signatures), undefined)
    assert.equal(
      classify(sample({ background: 'rgb(255, 254, 255)', boxShadow: panelShadow }), signatures)?.kind,
      'panel',
    )
    assert.equal(
      classify(sample({ background: 'rgb(254, 255, 255)', boxShadow: 'rgba(1, 0, 62, 0) 0px 0px 0px 0px' }), signatures)
        ?.kind,
      'panel',
    )
    assert.equal(
      classify(
        sample({ background: 'rgb(254, 255, 255)', boxShadow: 'rgba(1, 0, 63, 0) 0px 0px 0px 0px' }),
        signatures,
      ),
      undefined,
    )
  })

  it('keeps elevated dialogs glass when they occupy most of the viewport', () => {
    assert.equal(
      classify(sample({ background: 'rgb(255, 254, 255)', boxShadow: panelShadow, area: 0.8 }), signatures)?.kind,
      'panel',
    )
  })

  it('turns code blocks and their banners into calm glass', () => {
    assert.deepEqual(classify(sample({ background: 'rgb(249, 250, 250)' }), signatures), {
      kind: 'code',
      fill: 'code',
      paint: false,
      float: false,
    })
    assert.equal(classify(sample({ background: 'rgb(249, 251, 251)' }), signatures)?.kind, 'code')
    assert.equal(classify(sample({ background: 'rgb(249, 250, 250)', area: 0.9 }), signatures), undefined)
  })

  it('leaves a small base-filled element alone', () => {
    assert.equal(classify(sample({ background: 'rgb(255, 255, 254)', area: 0.01 }), signatures), undefined)
  })

  it('recognizes DSH menus by their material filter', () => {
    assert.deepEqual(classify(sample({ backdropFilter: 'blur(20px) saturate(1.8)' }), signatures), {
      kind: 'menu',
      fill: undefined,
      paint: true,
      float: false,
    })
    assert.equal(classify(sample({ backdropFilter: 'blur(4px)' }), signatures), undefined)
  })

  it('does not paint over an existing background image', () => {
    const result = classify(
      sample({ background: 'rgb(255, 255, 253)', backgroundImage: 'linear-gradient(red, blue)' }),
      signatures,
    )
    assert.equal(result?.paint, false)
  })
})
