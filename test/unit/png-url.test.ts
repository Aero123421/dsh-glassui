import assert from 'node:assert/strict'
import { inflateSync } from 'node:zlib'
import { describe, it } from 'node:test'
import { bezelFor, lensPixels } from '../../src/client/engine/lens-map.ts'
import { pngDataUrl } from '../../src/client/engine/png-url.ts'

function decodePng(url: string): { width: number; height: number; pixels: Uint8Array } {
  assert.ok(url.startsWith('data:image/png;base64,'))
  const bytes = Buffer.from(url.slice('data:image/png;base64,'.length), 'base64')
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  let offset = 8
  let width = 0
  let height = 0
  const idat: Buffer[] = []
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      assert.equal(data[8], 8)
      assert.equal(data[9], 6)
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    offset += 12 + length
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * 4
  const pixels = new Uint8Array(stride * height)
  let index = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[index++]
    const row = y * stride
    for (let x = 0; x < stride; x++) {
      const value = raw[index++] ?? 0
      if (filter === 0) pixels[row + x] = value
      else if (filter === 2) pixels[row + x] = (value + (y === 0 ? 0 : (pixels[row - stride + x] ?? 0))) & 255
      else throw new Error(`unexpected png filter ${filter}`)
    }
  }
  assert.equal(index, raw.length)
  return { width, height, pixels }
}

describe('pngDataUrl', () => {
  it('round-trips literals, repeats and an empty-looking neutral field', () => {
    const samples = [
      Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      new Uint8Array(64 * 4).fill(0),
      Uint8Array.from({ length: 80 }, (_, index) => (index % 4 === 3 ? 255 : 128)),
    ]
    for (const pixels of samples) {
      const width = pixels.length / 4
      const decoded = decodePng(pngDataUrl(pixels, width, 1))
      assert.equal(decoded.width, width)
      assert.equal(decoded.height, 1)
      assert.deepEqual(decoded.pixels, pixels)
    }
  })

  it('keeps every displacement pixel and stays compact', () => {
    const cases = [
      { width: 200, height: 100, radius: 20 },
      { width: 504, height: 110, radius: 28 },
      { width: 220, height: 44, radius: 16 },
      { width: 420, height: 260, radius: 28 },
      { width: 80, height: 400, radius: 12 },
    ]
    for (const { width, height, radius } of cases) {
      const pixels = lensPixels({ width, height, radius, bezel: bezelFor(width, height) })
      const url = pngDataUrl(pixels, width, height)
      const decoded = decodePng(url)
      assert.equal(decoded.width, width)
      assert.equal(decoded.height, height)
      assert.equal(Buffer.compare(decoded.pixels, Buffer.from(pixels)), 0)
      assert.ok(url.length < 80_000, `${width}x${height} url is ${url.length} chars`)
    }
  })
})
