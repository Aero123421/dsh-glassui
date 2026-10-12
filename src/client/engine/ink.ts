/**
 * Ink overflow of an element's own box decorations.
 *
 * Older Chromium offsets SVG backdrop filters by this overflow; newer versions
 * use the border box. Refraction is enabled only when the reach is zero, so the
 * same filter coordinates work in both (see lens.ts).
 */

/** How far the filter origin moves right and down, in CSS pixels. */
export interface InkShift {
  x: number
  y: number
}

/** Decorations that contribute to the shift, as `getComputedStyle` reports them. */
export interface InkStyle {
  boxShadow: string
  outlineStyle: string
  outlineWidth: string
  outlineOffset: string
}

/** Chromium paints a blurred shadow out to 1.5 times its blur radius. */
const BLUR_EXTENT = 1.5

/** Split a comma-separated list at top level, ignoring commas inside parentheses. */
function splitTopLevel(value: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < value.length; index++) {
    const char = value[index]
    if (char === '(') depth++
    else if (char === ')') depth = Math.max(0, depth - 1)
    else if (char === ',' && depth === 0) {
      parts.push(value.slice(start, index))
      start = index + 1
    }
  }
  parts.push(value.slice(start))
  return parts.map(part => part.trim()).filter(part => part.length > 0)
}

/** Remove every parenthesized group (color functions), keeping the rest. */
function stripGroups(value: string): string {
  let result = ''
  let depth = 0
  for (const char of value) {
    if (char === '(') depth++
    else if (char === ')') depth = Math.max(0, depth - 1)
    else if (depth === 0) result += char
  }
  return result
}

const LENGTH = /(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)px/gi

/**
 * How far the outer shadows of a computed `box-shadow` reach past the left and
 * top edges.
 * @param value - a computed `box-shadow` value, e.g. `rgba(0, 0, 0, 0.1) 0px 4px 16px -6px`.
 * @returns the reach in CSS pixels, at least zero; inset shadows do not count.
 */
export function shadowReach(value: string): InkShift {
  let x = 0
  let y = 0
  if (value.trim() === 'none') return { x, y }
  for (const shadow of splitTopLevel(value)) {
    const rest = stripGroups(shadow)
    if (/\binset\b/i.test(rest)) continue
    const lengths = [...rest.matchAll(LENGTH)].map(match => Number(match[1]))
    if (lengths.length < 2) continue
    const [offsetX = 0, offsetY = 0, blur = 0, spread = 0] = lengths
    const extent = Math.max(0, blur) * BLUR_EXTENT + spread
    x = Math.max(x, extent - offsetX)
    y = Math.max(y, extent - offsetY)
  }
  return { x, y }
}

/**
 * The shift of the SVG filter origin for an element's backdrop filter.
 * @param style - the element's computed decorations.
 * @returns whole CSS pixels, at least zero.
 */
export function inkShift(style: InkStyle): InkShift {
  const shadow = shadowReach(style.boxShadow)
  let outline = 0
  if (style.outlineStyle !== 'none') {
    outline = Math.max(0, (parseFloat(style.outlineWidth) || 0) + (parseFloat(style.outlineOffset) || 0))
  }
  // Chromium snaps the ink overflow outward to whole pixels.
  const snap = (value: number): number => Math.max(0, Math.ceil(value - 1e-3))
  return { x: snap(Math.max(shadow.x, outline)), y: snap(Math.max(shadow.y, outline)) }
}
