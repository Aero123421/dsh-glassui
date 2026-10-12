import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { inkShift, shadowReach } from '../../src/client/engine/ink.ts'

const plain = { outlineStyle: 'none', outlineWidth: '0px', outlineOffset: '0px' }

// Expected values were measured in Chromium 141 with a probe filter (see docs/architecture.md).
describe('inkShift', () => {
  it('is zero without decorations', () => {
    assert.deepEqual(inkShift({ boxShadow: 'none', ...plain }), { x: 0, y: 0 })
  })

  it('follows a spread shadow', () => {
    assert.deepEqual(inkShift({ boxShadow: 'rgba(0, 0, 0, 0.2) 0px 0px 0px 20px', ...plain }), { x: 20, y: 20 })
  })

  it('reaches 1.5 times the blur radius, less spread and offset', () => {
    assert.deepEqual(inkShift({ boxShadow: 'rgb(0, 0, 0) 0px 10px 28px -10px', ...plain }), { x: 32, y: 22 })
    assert.deepEqual(inkShift({ boxShadow: 'rgb(0, 0, 0) 0px 0px 20px 0px', ...plain }), { x: 30, y: 30 })
  })

  it('subtracts positive offsets and never goes negative', () => {
    assert.deepEqual(inkShift({ boxShadow: 'rgba(0, 0, 0, 0.2) 10px 5px 0px 10px', ...plain }), { x: 0, y: 5 })
    assert.deepEqual(inkShift({ boxShadow: 'rgb(0, 0, 0) 40px 40px 2px 0px', ...plain }), { x: 0, y: 0 })
  })

  it('rounds sub-pixel reach up', () => {
    assert.deepEqual(inkShift({ boxShadow: 'rgb(0, 0, 0) 0px 0px 0px 0.5px', ...plain }), { x: 1, y: 1 })
  })

  it('ignores inset shadows', () => {
    assert.deepEqual(inkShift({ boxShadow: 'rgb(255, 165, 0) 0px 0px 0px 30px inset', ...plain }), { x: 0, y: 0 })
  })

  it('takes the largest reach of a list', () => {
    const composer =
      'rgba(255, 255, 255, 0.12) 0px 0px 0px 0.5px, rgba(255, 255, 255, 0.32) 1px 1.5px 0px -0.5px inset, ' +
      'rgba(0, 0, 0, 0.06) 0px 4px 16px -6px, rgba(0, 0, 0, 0.42) 0px 14px 36px -16px, rgba(1, 0, 63, 0) 0px 0px 0px 0px'
    assert.deepEqual(inkShift({ boxShadow: composer, ...plain }), { x: 38, y: 24 })
  })

  it('counts an outline', () => {
    assert.deepEqual(
      inkShift({ boxShadow: 'none', outlineStyle: 'solid', outlineWidth: '4px', outlineOffset: '6px' }),
      { x: 10, y: 10 },
    )
    assert.deepEqual(inkShift({ boxShadow: 'none', outlineStyle: 'none', outlineWidth: '4px', outlineOffset: '6px' }), {
      x: 0,
      y: 0,
    })
  })

  it('reads colors in any syntax', () => {
    assert.deepEqual(shadowReach('color(srgb 0 0 0 / 0.5) 0px 0px 0px 3px'), { x: 3, y: 3 })
    assert.deepEqual(shadowReach('0px 0px 0px 3px rgb(0, 0, 0)'), { x: 3, y: 3 })
  })
})

describe('shadowReach', () => {
  it('keeps the contained elevation of refracting surfaces inside the box', () => {
    // Mirrors CONTAINED_ELEVATION in src/shared/stylesheet.ts.
    const contained =
      'rgba(0, 0, 0, 0.12) 0px 1px 2px -3px, rgba(0, 0, 0, 0.2) 0px 16px 22px -33px, rgba(1, 0, 61, 0) 0px 0px 0px 0px'
    const reach = shadowReach(contained)
    assert.ok(reach.x <= 0 && reach.y <= 0, JSON.stringify(reach))
  })
})
