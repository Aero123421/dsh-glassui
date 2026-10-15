/**
 * PNG data URL for an RGBA bitmap, without `canvas.toDataURL`.
 *
 * A 2D canvas in Chromium is usually on the GPU. Encoding it reads the whole
 * bitmap back, which dominated the time to build a refraction filter. These
 * bytes are the same pixels `feImage` would decode from that canvas PNG: 8-bit
 * sRGB, non-interlaced, one row per scanline. The URL stays small because the
 * neutral interior of a displacement map compresses.
 */

const SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])

interface Huffman {
  readonly bits: number
  readonly length: number
}

interface ExtraCode {
  readonly symbol: number
  readonly extra: number
  readonly value: number
}

const LITERALS = buildLiteralCodes()
const DISTANCES = buildDistanceCodes()
const LENGTH_BY_SIZE = buildLengthTable()
/** First distance each fixed-Huffman symbol represents. Kept as numbers, not one object per distance. */
const DISTANCE_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577,
]
const DISTANCE_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
]

/**
 * Encode `width × height` RGBA pixels as a PNG data URL.
 * @param pixels - row-major RGBA, `width × height × 4` bytes.
 * @param width - image width in pixels.
 * @param height - image height in pixels.
 * @returns `data:image/png;base64,...`
 */
export function pngDataUrl(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number): string {
  if (width < 1 || height < 1 || pixels.length !== width * height * 4) throw new Error('png size')
  const scanlines = filterUp(pixels, width, height)
  const idat = chunk('IDAT', zlibStore(deflateFixed(scanlines), scanlines))
  const ihdr = new Uint8Array(13)
  const view = new DataView(ihdr.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  ihdr[8] = 8
  ihdr[9] = 6
  const png = concat([SIGNATURE, chunk('IHDR', ihdr), idat, chunk('IEND', new Uint8Array())])
  return `data:image/png;base64,${bytesToBase64(png)}`
}

/** PNG "Up" predictor: a repeated row becomes zeros, which deflate stores as matches. */
function filterUp(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number): Uint8Array {
  const stride = width * 4
  const raw = new Uint8Array(height * (stride + 1))
  let output = 0
  for (let y = 0; y < height; y++) {
    const row = y * stride
    raw[output++] = y === 0 ? 0 : 2
    const previous = row - stride
    for (let x = 0; x < stride; x++) {
      const value = pixels[row + x] ?? 0
      const above = y === 0 ? 0 : (pixels[previous + x] ?? 0)
      raw[output++] = y === 0 ? value : (value - above) & 255
    }
  }
  return raw
}

class BitWriter {
  private readonly bytes: number[] = []
  private accumulator = 0
  private bits = 0

  /** Append the low `length` bits of `value`, least significant bit first. */
  push(value: number, length: number): void {
    let rest = length
    let pending = value
    while (rest > 0) {
      const take = Math.min(rest, 16)
      this.accumulator |= (pending & ((1 << take) - 1)) << this.bits
      this.bits += take
      pending >>>= take
      rest -= take
      while (this.bits >= 8) {
        this.bytes.push(this.accumulator & 0xff)
        this.accumulator >>>= 8
        this.bits -= 8
      }
    }
  }

  finish(): Uint8Array {
    if (this.bits > 0) this.bytes.push(this.accumulator & 0xff)
    return Uint8Array.from(this.bytes)
  }
}

/**
 * One fixed-Huffman deflate block. Matches are exact copies, so the inflated
 * bytes equal `data` even when the search stops early.
 */
function deflateFixed(data: Uint8Array): Uint8Array {
  const writer = new BitWriter()
  writer.push(1, 1)
  writer.push(1, 2)
  const count = data.length
  const head = new Int32Array(32768)
  head.fill(-1)
  // Links are stored only for the last 32 KiB. Older links fall outside the deflate window.
  const previous = new Int32Array(32768)
  previous.fill(-1)
  let index = 0
  while (index < count) {
    let bestLength = 0
    let bestDistance = 0
    if (index + 2 < count) {
      const hash = hashAt(data, index)
      let node = head[hash] ?? -1
      let looked = 0
      while (node >= 0 && node < index && index - node <= 32768 && looked < 24) {
        const distance = index - node
        if (sameTriple(data, node, index)) {
          let length = 3
          const max = Math.min(258, count - index)
          while (length < max && data[node + length] === data[index + length]) length++
          if (length > bestLength) {
            bestLength = length
            bestDistance = distance
            if (length === max) break
          }
        }
        node = previous[node & 32767] ?? -1
        looked++
      }
      remember(data, head, previous, index)
    }
    if (bestLength >= 3 && bestDistance >= 1) {
      emitMatch(writer, bestLength, bestDistance)
      const end = index + bestLength
      for (let at = index + 1; at < end && at + 2 < count; at++) remember(data, head, previous, at)
      index = end
    } else {
      emitSymbol(writer, data[index] ?? 0)
      index++
    }
  }
  emitSymbol(writer, 256)
  return writer.finish()
}

function hashAt(data: Uint8Array, index: number): number {
  return (((data[index] ?? 0) * 31 + (data[index + 1] ?? 0)) * 31 + (data[index + 2] ?? 0)) & 32767
}

function sameTriple(data: Uint8Array, left: number, right: number): boolean {
  return data[left] === data[right] && data[left + 1] === data[right + 1] && data[left + 2] === data[right + 2]
}

function remember(data: Uint8Array, head: Int32Array, previous: Int32Array, index: number): void {
  const hash = hashAt(data, index)
  previous[index & 32767] = head[hash] ?? -1
  head[hash] = index
}

function emitSymbol(writer: BitWriter, symbol: number): void {
  const code = LITERALS[symbol]
  if (code === undefined) throw new Error(`png symbol ${symbol}`)
  writer.push(code.bits, code.length)
}

function emitMatch(writer: BitWriter, length: number, distance: number): void {
  const codedLength = LENGTH_BY_SIZE[length]
  const codedDistance = distanceCode(distance)
  if (codedLength === undefined || codedDistance === undefined) throw new Error('png match')
  emitSymbol(writer, codedLength.symbol)
  if (codedLength.extra > 0) writer.push(codedLength.value, codedLength.extra)
  const bits = DISTANCES[codedDistance.symbol]
  if (bits === undefined) throw new Error('png distance')
  writer.push(bits.bits, bits.length)
  if (codedDistance.extra > 0) writer.push(codedDistance.value, codedDistance.extra)
}

function distanceCode(distance: number): ExtraCode | undefined {
  if (distance < 1 || distance > 32768) return undefined
  let symbol = 29
  for (let index = 0; index < DISTANCE_BASE.length; index++) {
    const next = DISTANCE_BASE[index + 1] ?? 32769
    if (distance < next) {
      symbol = index
      break
    }
  }
  const base = DISTANCE_BASE[symbol] ?? 1
  const extra = DISTANCE_EXTRA[symbol] ?? 0
  return { symbol, extra, value: distance - base }
}

function zlibStore(deflated: Uint8Array, raw: Uint8Array): Uint8Array {
  const out = new Uint8Array(deflated.length + 6)
  out[0] = 0x78
  out[1] = 0x01
  out.set(deflated, 2)
  new DataView(out.buffer).setUint32(deflated.length + 2, adler32(raw))
  return out
}

function adler32(data: Uint8Array): number {
  let a = 1
  let b = 0
  for (let index = 0; index < data.length; index++) {
    a += data[index] ?? 0
    b += a
    if ((index & 4095) === 4095) {
      a %= 65521
      b %= 65521
    }
  }
  a %= 65521
  b %= 65521
  return ((b << 16) | a) >>> 0
}

const CRC_TABLE = buildCrcTable()

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out[4] = type.charCodeAt(0)
  out[5] = type.charCodeAt(1)
  out[6] = type.charCodeAt(2)
  out[7] = type.charCodeAt(3)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256)
  for (let value = 0; value < 256; value++) {
    let crc = value
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    table[value] = crc >>> 0
  }
  return table
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  let length = 0
  for (const part of parts) length += part.length
  const out = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 8192) {
    const slice = bytes.subarray(index, index + 8192)
    binary += String.fromCharCode(...slice)
  }
  return btoa(binary)
}

function reverseBits(code: number, length: number): number {
  let reversed = 0
  for (let bit = 0; bit < length; bit++) reversed = (reversed << 1) | ((code >>> bit) & 1)
  return reversed
}

function buildLiteralCodes(): readonly Huffman[] {
  const codes: Huffman[] = []
  const add = (symbol: number, code: number, length: number): void => {
    codes[symbol] = { bits: reverseBits(code, length), length }
  }
  for (let symbol = 0; symbol <= 143; symbol++) add(symbol, 0b00110000 + symbol, 8)
  for (let symbol = 144; symbol <= 255; symbol++) add(symbol, 0b110010000 + (symbol - 144), 9)
  for (let symbol = 256; symbol <= 279; symbol++) add(symbol, symbol - 256, 7)
  for (let symbol = 280; symbol <= 287; symbol++) add(symbol, 0b11000000 + (symbol - 280), 8)
  return codes
}

function buildDistanceCodes(): readonly Huffman[] {
  const codes: Huffman[] = []
  for (let symbol = 0; symbol <= 29; symbol++) codes[symbol] = { bits: reverseBits(symbol, 5), length: 5 }
  return codes
}

function buildLengthTable(): readonly (ExtraCode | undefined)[] {
  const table: (ExtraCode | undefined)[] = []
  const fill = (from: number, to: number, extra: number, base: number): void => {
    let length = base
    for (let symbol = from; symbol <= to; symbol++) {
      const span = 1 << extra
      for (let value = 0; value < span; value++) table[length++] = { symbol, extra, value }
    }
  }
  fill(257, 264, 0, 3)
  fill(265, 268, 1, 11)
  fill(269, 272, 2, 19)
  fill(273, 276, 3, 35)
  fill(277, 280, 4, 67)
  fill(281, 283, 5, 131)
  for (let value = 0; value < 31; value++) table[227 + value] = { symbol: 284, extra: 5, value }
  table[258] = { symbol: 285, extra: 0, value: 0 }
  return table
}
