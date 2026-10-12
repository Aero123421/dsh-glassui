import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { bezelFor, lensPixels, scaleFor } from '../../src/client/engine/lens-map.ts'

function pixel(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number, number] {
  const k = (y * width + x) * 4
  return [data[k] ?? -1, data[k + 1] ?? -1, data[k + 2] ?? -1, data[k + 3] ?? -1]
}

describe('bezelFor / scaleFor', () => {
  it('keeps the bezel between 6 and 28 pixels', () => {
    assert.equal(bezelFor(10, 10), 6)
    assert.equal(bezelFor(800, 40), 40 * 0.34)
    assert.equal(bezelFor(800, 400), 28)
  })

  it('scales the displacement with the bezel', () => {
    assert.equal(scaleFor(28), 48)
    assert.equal(scaleFor(6), 10)
  })
})

describe('lensPixels', () => {
  const geometry = { width: 200, height: 100, radius: 20, bezel: 24 }
  const data = lensPixels(geometry)

  it('has one opaque RGBA pixel per CSS pixel', () => {
    assert.equal(data.length, 200 * 100 * 4)
    for (let k = 3; k < data.length; k += 4) assert.equal(data[k], 255)
  })

  it('is neutral in the interior and outside the rounded corners', () => {
    assert.deepEqual(pixel(data, 200, 100, 50), [128, 128, 128, 255])
    assert.deepEqual(pixel(data, 200, 0, 0), [128, 128, 128, 255])
    assert.deepEqual(pixel(data, 200, 199, 99), [128, 128, 128, 255])
  })

  it('samples inward along each edge', () => {
    const [leftR] = pixel(data, 200, 1, 50)
    const [rightR] = pixel(data, 200, 198, 50)
    const [, topG] = pixel(data, 200, 100, 1)
    const [, bottomG] = pixel(data, 200, 100, 98)
    assert.ok(leftR > 200, `left ${leftR}`)
    assert.ok(rightR < 56, `right ${rightR}`)
    assert.ok(topG > 200, `top ${topG}`)
    assert.ok(bottomG < 56, `bottom ${bottomG}`)
  })

  it('fades out across the bezel', () => {
    const strengths = [1, 6, 12, 18, 23].map(x => pixel(data, 200, x, 50)[0] - 128)
    for (let index = 1; index < strengths.length; index++) {
      assert.ok((strengths[index] ?? 0) <= (strengths[index - 1] ?? 0), strengths.join(','))
    }
    assert.equal(pixel(data, 200, 25, 50)[0], 128)
  })

  it('is mirror-symmetric', () => {
    for (const [x, y] of [
      [3, 40],
      [10, 5],
      [30, 2],
    ] as const) {
      const [r, g] = pixel(data, 200, x, y)
      const [mr, mg] = pixel(data, 200, 199 - x, 99 - y)
      assert.ok(Math.abs(r - 128 + (mr - 128)) <= 1, `${x},${y}`)
      assert.ok(Math.abs(g - 128 + (mg - 128)) <= 1, `${x},${y}`)
    }
  })
})
