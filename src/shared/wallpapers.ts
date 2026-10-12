/**
 * Built-in wallpapers: layered ribbons of color with soft shadows and a glossy
 * crest, drawn as a small SVG (about 5 KB) so no image files ship and the Host
 * can embed the active one in the boot HTML. Output is deterministic.
 */
import type { WallpaperPreset } from './settings.ts'

/** Color scheme of the page. */
export type Scheme = 'light' | 'dark'

interface Palette {
  /** Top and bottom of the base gradient. */
  bg: readonly [string, string]
  /** Light falling in from the top left. */
  glow: string
  /** Glossy line along each ribbon's crest. */
  crest: string
  /** Shadow each ribbon casts on the one behind it. */
  shade: string
  /** Start and end color of each ribbon, back to front. */
  ribbons: readonly (readonly [string, string])[]
}

const PALETTES: Readonly<Record<WallpaperPreset, Readonly<Record<Scheme, Palette>>>> = {
  bay: {
    light: {
      bg: ['#b9d4ff', '#eef4ff'],
      glow: 'rgba(255,255,255,0.75)',
      crest: 'rgba(255,255,255,0.7)',
      shade: 'rgba(10,40,120,0.16)',
      ribbons: [
        ['#9cc6ff', '#cfe6ff'],
        ['#5f9df7', '#97ccff'],
        ['#4cc0e8', '#3d8ff2'],
        ['#2f72e8', '#6aaeff'],
        ['#1d4fc4', '#4b8cf0'],
      ],
    },
    dark: {
      bg: ['#040a1e', '#0b1838'],
      glow: 'rgba(80,140,255,0.35)',
      crest: 'rgba(170,210,255,0.35)',
      shade: 'rgba(0,0,0,0.45)',
      ribbons: [
        ['#183a8c', '#2c63c6'],
        ['#1d55b8', '#3a8ae0'],
        ['#0f7fa6', '#2266c8'],
        ['#2a3fb0', '#4b78e0'],
        ['#101f66', '#2647a8'],
      ],
    },
  },
  sunrise: {
    light: {
      bg: ['#ffd9bf', '#fff1e8'],
      glow: 'rgba(255,255,255,0.75)',
      crest: 'rgba(255,255,255,0.7)',
      shade: 'rgba(120,30,60,0.14)',
      ribbons: [
        ['#ffc49a', '#ffe0c2'],
        ['#ff9a8c', '#ffc49a'],
        ['#f084b8', '#ff9e94'],
        ['#b58cf0', '#ef8cc4'],
        ['#7e6ee6', '#b48cf0'],
      ],
    },
    dark: {
      bg: ['#16070c', '#24101e'],
      glow: 'rgba(255,120,90,0.3)',
      crest: 'rgba(255,200,170,0.3)',
      shade: 'rgba(0,0,0,0.45)',
      ribbons: [
        ['#8a3a1e', '#c26434'],
        ['#962c44', '#c4563a'],
        ['#82306e', '#b0425a'],
        ['#55348e', '#8a3a7c'],
        ['#2c2470', '#5a3490'],
      ],
    },
  },
  meadow: {
    light: {
      bg: ['#d2f0dc', '#f1faf3'],
      glow: 'rgba(255,255,255,0.75)',
      crest: 'rgba(255,255,255,0.7)',
      shade: 'rgba(10,80,50,0.14)',
      ribbons: [
        ['#bfeac8', '#e0f6e2'],
        ['#86d8a6', '#bdebc8'],
        ['#4fc4a6', '#86d89a'],
        ['#2fa59a', '#5ccaa0'],
        ['#1f7f86', '#3aa894'],
      ],
    },
    dark: {
      bg: ['#03120e', '#08201a'],
      glow: 'rgba(80,220,160,0.25)',
      crest: 'rgba(170,255,210,0.28)',
      shade: 'rgba(0,0,0,0.45)',
      ribbons: [
        ['#185c3c', '#2a8a56'],
        ['#11704e', '#2a9a66'],
        ['#0c6a64', '#1a8a6e'],
        ['#0e5260', '#127068'],
        ['#08343e', '#0e5056'],
      ],
    },
  },
  graphite: {
    light: {
      bg: ['#dcdfe5', '#f4f5f7'],
      glow: 'rgba(255,255,255,0.8)',
      crest: 'rgba(255,255,255,0.75)',
      shade: 'rgba(0,0,0,0.12)',
      ribbons: [
        ['#d2d6dd', '#e8eaee'],
        ['#b6bbc5', '#d4d8de'],
        ['#9aa0ac', '#bcc1c9'],
        ['#7e8492', '#a2a8b2'],
        ['#626876', '#868c98'],
      ],
    },
    dark: {
      bg: ['#0c0d0f', '#1a1b1f'],
      glow: 'rgba(255,255,255,0.12)',
      crest: 'rgba(255,255,255,0.22)',
      shade: 'rgba(0,0,0,0.5)',
      ribbons: [
        ['#3a3d44', '#4e525a'],
        ['#2e3138', '#43474f'],
        ['#25282e', '#373a42'],
        ['#1d1f24', '#2c2f35'],
        ['#141519', '#22242a'],
      ],
    },
  },
}

const WIDTH = 1600
const HEIGHT = 1000
const SAMPLES = 12

function round(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/** Crest of ribbon `k`: two summed waves sloping gently down to the left. */
function crest(k: number): [number, number][] {
  const y0 = HEIGHT * (0.26 + k * 0.135)
  const amp = HEIGHT * (0.075 + k * 0.012)
  const f1 = 0.9 + k * 0.28
  const f2 = 2.1 + k * 0.45
  const phase = k * 1.15 + 0.4
  const points: [number, number][] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const x = -WIDTH * 0.06 + (WIDTH * 1.12 * i) / SAMPLES
    const s = x / WIDTH
    const y =
      y0 +
      amp * Math.sin(f1 * s * Math.PI * 2 + phase) +
      amp * 0.38 * Math.sin(f2 * s * Math.PI * 2 + phase * 1.7) -
      s * HEIGHT * 0.1
    points.push([x, y])
  }
  return points
}

/** Closed path: the crest as a Catmull-Rom spline, then down and around below the frame. */
function ribbonPath(points: readonly [number, number][]): string {
  const at = (i: number): [number, number] => points[Math.max(0, Math.min(points.length - 1, i))] ?? [0, 0]
  const [x0, y0] = at(0)
  let d = `M${round(x0)} ${round(y0)}`
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = at(i - 1)
    const [bx, by] = at(i)
    const [cx, cy] = at(i + 1)
    const [ex, ey] = at(i + 2)
    const c1x = bx + (cx - ax) / 6
    const c1y = by + (cy - ay) / 6
    const c2x = cx - (ex - bx) / 6
    const c2y = cy - (ey - by) / 6
    d += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(cx)} ${round(cy)}`
  }
  const right = WIDTH * 1.06
  const left = -WIDTH * 0.06
  return `${d}L${round(right)} ${HEIGHT + 120}L${round(left)} ${HEIGHT + 120}Z`
}

/**
 * Draw a wallpaper.
 * @param preset - which wallpaper.
 * @param scheme - light or dark palette.
 * @returns standalone SVG markup with a 16:10 view box that covers any aspect ratio.
 */
export function wallpaperSvg(preset: WallpaperPreset, scheme: Scheme): string {
  const p = PALETTES[preset][scheme]
  const defs: string[] = [
    `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient>`,
    `<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${WIDTH * 0.22}" cy="${HEIGHT * 0.05}" r="${WIDTH * 0.7}"><stop offset="0" stop-color="${p.glow}"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>`,
    '<filter id="s" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>',
    '<filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>',
    '<filter id="c" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>',
  ]
  const layers: string[] = [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#b)"/>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>`,
  ]
  p.ribbons.forEach(([from, to], k) => {
    defs.push(
      `<linearGradient id="r${k}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${WIDTH}" y2="${HEIGHT * 0.4}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`,
      `<path id="p${k}" d="${ribbonPath(crest(k))}"/>`,
    )
    layers.push(
      `<use href="#p${k}" fill="${p.shade}" filter="url(#s)" transform="translate(0 -12)"/>`,
      `<use href="#p${k}" fill="url(#r${k})" fill-opacity="0.92" filter="url(#f)"/>`,
      `<use href="#p${k}" fill="none" stroke="${p.crest}" stroke-width="2.5" filter="url(#c)"/>`,
    )
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice"><defs>${defs.join('')}</defs>${layers.join('')}</svg>`
}

/**
 * Encode SVG markup as a data URL that is safe inside a double-quoted CSS `url()`
 * and a JavaScript string: no double quotes, no raw `%`, `#`, `<`, `>` or line breaks.
 * @param svg - SVG markup.
 * @returns a `data:image/svg+xml,` URL.
 */
export function svgDataUrl(svg: string): string {
  const encoded = svg
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
  return `data:image/svg+xml,${encoded}`
}

/**
 * The CSS image value of a built-in wallpaper.
 * @param preset - which wallpaper.
 * @param scheme - light or dark palette.
 * @returns a `url("data:…")` value.
 */
export function wallpaperImage(preset: WallpaperPreset, scheme: Scheme): string {
  return `url("${svgDataUrl(wallpaperSvg(preset, scheme))}")`
}
