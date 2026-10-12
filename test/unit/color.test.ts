import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatColor, nudgeApart, parseColor, type Rgba } from '../../src/shared/color.ts'

describe('parseColor', () => {
  it('reads the legacy comma syntax', () => {
    assert.deepEqual(parseColor('rgb(255, 255, 255)'), { r: 255, g: 255, b: 255, a: 1 })
    assert.deepEqual(parseColor('rgba(0, 0, 0, 0.5)'), { r: 0, g: 0, b: 0, a: 0.5 })
    assert.deepEqual(parseColor('rgba(10, 20, 30, 50%)'), { r: 10, g: 20, b: 30, a: 0.5 })
  })

  it('reads the space syntax', () => {
    assert.deepEqual(parseColor('rgb(1 2 3)'), { r: 1, g: 2, b: 3, a: 1 })
    assert.deepEqual(parseColor('rgb(1 2 3 / 0.25)'), { r: 1, g: 2, b: 3, a: 0.25 })
  })

  it('reads color(srgb …)', () => {
    assert.deepEqual(parseColor('color(srgb 1 0.5 0)'), { r: 255, g: 128, b: 0, a: 1 })
    assert.deepEqual(parseColor('color(srgb 0 0 1 / 0.4)'), { r: 0, g: 0, b: 255, a: 0.4 })
  })

  it('clamps out-of-range channels', () => {
    assert.deepEqual(parseColor('rgb(300, -4, 12.6)'), { r: 255, g: 0, b: 13, a: 1 })
    assert.deepEqual(parseColor('rgba(0, 0, 0, 2)'), { r: 0, g: 0, b: 0, a: 1 })
  })

  it('returns undefined for other syntax', () => {
    for (const value of [
      '',
      'red',
      'transparent',
      '#fff',
      'oklch(0.5 0.1 200)',
      'color(display-p3 1 0 0)',
      'rgb(1 2)',
    ]) {
      assert.equal(parseColor(value), undefined, value)
    }
  })
})

describe('formatColor', () => {
  it('omits an opaque alpha and rounds the rest', () => {
    assert.equal(formatColor({ r: 1, g: 2, b: 3, a: 1 }), 'rgb(1 2 3)')
    assert.equal(formatColor({ r: 1, g: 2, b: 3, a: 0.123456 }), 'rgb(1 2 3 / 0.123)')
  })

  it('round-trips through parseColor', () => {
    const color: Rgba = { r: 12, g: 34, b: 56, a: 0.75 }
    assert.deepEqual(parseColor(formatColor(color)), color)
  })
})

describe('nudgeApart', () => {
  const white: Rgba = { r: 255, g: 255, b: 255, a: 1 }

  it('gives identical colors distinct, nearby values', () => {
    const result = nudgeApart(
      [
        ['a', white],
        ['b', white],
        ['c', white],
      ],
      [],
    )
    assert.equal(result.size, 3)
    const keys = new Set([...result.values()].map(formatColor))
    assert.equal(keys.size, 3)
    for (const color of result.values()) {
      const distance = Math.abs(color.r - 255) + Math.abs(color.g - 255) + Math.abs(color.b - 255)
      assert.ok(distance >= 1 && distance <= 3, formatColor(color))
      assert.equal(color.a, 1)
    }
  })

  it('moves every entry, even a unique one', () => {
    const result = nudgeApart([['only', { r: 10, g: 10, b: 10, a: 1 }]], [])
    assert.notDeepEqual(result.get('only'), { r: 10, g: 10, b: 10, a: 1 })
  })

  it('avoids reserved colors and the original values', () => {
    const reserved = [
      { r: 255, g: 255, b: 254, a: 1 },
      { r: 255, g: 255, b: 253, a: 1 },
    ]
    const result = nudgeApart([['a', white]], reserved)
    const nudged = result.get('a')
    assert.ok(nudged)
    for (const color of [white, ...reserved]) assert.notDeepEqual(nudged, color)
  })

  it('skips undefined entries', () => {
    const result = nudgeApart(
      [
        ['a', undefined],
        ['b', white],
      ],
      [],
    )
    assert.deepEqual([...result.keys()], ['b'])
  })

  it('stays within the 8-bit range', () => {
    const black: Rgba = { r: 0, g: 0, b: 0, a: 1 }
    const result = nudgeApart(
      Array.from({ length: 6 }, (_, index) => [`k${index}`, black] as const),
      [],
    )
    for (const color of result.values()) {
      for (const channel of [color.r, color.g, color.b]) assert.ok(channel >= 0 && channel <= 255)
    }
    assert.equal(new Set([...result.values()].map(formatColor)).size, result.size)
  })
})
