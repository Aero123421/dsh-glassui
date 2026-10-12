/**
 * Parsing of computed colors and the "nudge" that makes one token's color unique.
 *
 * Several DSH tokens share a value (in the light palette the base, layer and
 * input fills are all white). To tell them apart on screen the engine moves each
 * watched token by one or two steps of a single 8-bit channel: invisible, but
 * enough for an exact comparison of computed styles.
 */

/** An sRGB color with 8-bit channels and a 0..1 alpha. */
export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

const NUMBER = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?`
const LEGACY = new RegExp(
  String.raw`^rgba?\(\s*(${NUMBER})\s*,\s*(${NUMBER})\s*,\s*(${NUMBER})\s*(?:,\s*(${NUMBER})(%?)\s*)?\)$`,
  'i',
)
const MODERN = new RegExp(
  String.raw`^rgba?\(\s*(${NUMBER})\s+(${NUMBER})\s+(${NUMBER})\s*(?:/\s*(${NUMBER})(%?)\s*)?\)$`,
  'i',
)
const SRGB = new RegExp(
  String.raw`^color\(\s*srgb\s+(${NUMBER})\s+(${NUMBER})\s+(${NUMBER})\s*(?:/\s*(${NUMBER})(%?)\s*)?\)$`,
  'i',
)

function clamp8(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
}

function alpha(value: string | undefined, percent: string | undefined): number {
  if (value === undefined) return 1
  const parsed = Number(value) / (percent === '%' ? 100 : 1)
  return Math.min(1, Math.max(0, parsed))
}

/**
 * Parse a color as browsers serialize computed values: `rgb()`/`rgba()` in the
 * legacy comma form or the space form, or `color(srgb …)`.
 * @param value - a computed color string.
 * @returns the color, or undefined for any other syntax (keywords, other color spaces).
 */
export function parseColor(value: string): Rgba | undefined {
  const text = value.trim()
  const rgb = LEGACY.exec(text) ?? MODERN.exec(text)
  if (rgb) {
    return { r: clamp8(Number(rgb[1])), g: clamp8(Number(rgb[2])), b: clamp8(Number(rgb[3])), a: alpha(rgb[4], rgb[5]) }
  }
  const srgb = SRGB.exec(text)
  if (srgb) {
    return {
      r: clamp8(Number(srgb[1]) * 255),
      g: clamp8(Number(srgb[2]) * 255),
      b: clamp8(Number(srgb[3]) * 255),
      a: alpha(srgb[4], srgb[5]),
    }
  }
  return undefined
}

/**
 * Serialize a color in the modern space-separated syntax.
 * @param color - the color.
 * @returns e.g. `rgb(255 255 254 / 0.58)`; the alpha part is omitted when opaque.
 */
export function formatColor(color: Rgba): string {
  const a = Math.round(color.a * 1000) / 1000
  return a >= 1 ? `rgb(${color.r} ${color.g} ${color.b})` : `rgb(${color.r} ${color.g} ${color.b} / ${a})`
}

function key(color: Rgba): string {
  return `${color.r},${color.g},${color.b},${Math.round(color.a * 1000)}`
}

const STEPS = [1, -1, 2, -2, 3, -3] as const
const CHANNELS = ['b', 'g', 'r'] as const

/**
 * Give each color in `colors` a value that differs from every original and nudged
 * entry and from every color in `reserved`, moving one channel by at most three
 * steps. Every entry moves, including one that is already unique, so a watched
 * token never keeps a value that an unwatched token might also use.
 * @param colors - watched colors keyed by name, in priority order; undefined entries are skipped.
 * @param reserved - colors used elsewhere that the results must avoid.
 * @returns nudged colors keyed by name; names whose color could not be made unique are absent.
 */
export function nudgeApart<K extends string>(
  colors: readonly (readonly [K, Rgba | undefined])[],
  reserved: readonly Rgba[],
): Map<K, Rgba> {
  const taken = new Set(reserved.map(key))
  for (const [, color] of colors) if (color) taken.add(key(color))
  const result = new Map<K, Rgba>()
  for (const [name, color] of colors) {
    if (!color) continue
    let found: Rgba | undefined
    search: for (const channel of CHANNELS) {
      for (const step of STEPS) {
        const value = color[channel] + step
        if (value < 0 || value > 255) continue
        const candidate = { ...color, [channel]: value }
        if (!taken.has(key(candidate))) {
          found = candidate
          break search
        }
      }
    }
    if (found) {
      taken.add(key(found))
      result.set(name, found)
    }
  }
  return result
}
