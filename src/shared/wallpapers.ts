/**
 * Built-in wallpapers, drawn as small deterministic SVGs so no image files ship
 * and the Host can embed the active one in the boot HTML.
 *
 * Two styles:
 * - **ribbons**: layered bands of color with soft shadows and a glossy crest;
 * - **blobs**: large soft spots of color over a gradient, like light through frosted glass.
 *
 * A wallpaper is a stack of layers, each a full-frame SVG with the same 16:10
 * view box. Static wallpapers are drawn as one image. Animated ones keep their
 * base as the page background and move the other layers, as whole composited
 * images, along slow paths (see {@link WallpaperMotion}); their first frame is
 * the same picture as the static image, which is what the first paint and
 * "reduce motion" show.
 */
import type { WallpaperPreset } from './settings.ts'

/** Color scheme of the page. */
export type Scheme = 'light' | 'dark'

/** How one layer of an animated wallpaper moves. It travels out and back, forever. */
export interface WallpaperMotion {
  /** Seconds for one way; a whole number, so every layer steps on the same clock. */
  duration: number
  /** Horizontal travel, in percent of the frame width. */
  x: number
  /** Vertical travel, in percent of the frame height. */
  y: number
  /** Scale at the far end of the path. */
  scale: number
}

/** One layer: standalone SVG markup, and how it moves (undefined for the static base). */
export interface WallpaperLayer {
  svg: string
  motion: WallpaperMotion | undefined
}

type RibbonPreset = 'bay' | 'sunrise' | 'meadow' | 'graphite' | 'lagoon' | 'dusk' | 'dune' | 'tide'
type BlobPreset = 'aurora' | 'bloom' | 'prism'

interface RibbonPalette {
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

interface BlobPalette {
  /** Center and radius of each blob in view box units, when not the default arrangement. */
  geometry?: readonly (readonly [number, number, number])[]
  /** Top and bottom of the base gradient. */
  bg: readonly [string, string]
  /** Light falling in from the top left. */
  glow: string
  /** Color and strength of each blob, back to front. */
  blobs: readonly (readonly [string, number])[]
}

const RIBBONS: Readonly<Record<RibbonPreset, Readonly<Record<Scheme, RibbonPalette>>>> = {
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
  lagoon: {
    light: {
      bg: ['#bdeff0', '#effbfb'],
      glow: 'rgba(255,255,255,0.75)',
      crest: 'rgba(255,255,255,0.7)',
      shade: 'rgba(0,90,100,0.15)',
      ribbons: [
        ['#a6eae6', '#d4f6f2'],
        ['#62d6d2', '#9fe9e2'],
        ['#2fc0c8', '#5fd8cf'],
        ['#1a9fb6', '#3cc2c4'],
        ['#0d7a98', '#1fa2b2'],
      ],
    },
    dark: {
      bg: ['#021317', '#06252b'],
      glow: 'rgba(60,220,220,0.25)',
      crest: 'rgba(160,255,250,0.28)',
      shade: 'rgba(0,0,0,0.45)',
      ribbons: [
        ['#0d5a5e', '#178a86'],
        ['#0b6e72', '#16a0a0'],
        ['#08707e', '#0f8e96'],
        ['#075866', '#0b7682'],
        ['#043a46', '#08525e'],
      ],
    },
  },
  dusk: {
    light: {
      bg: ['#e4d7ff', '#fbf1ff'],
      glow: 'rgba(255,255,255,0.7)',
      crest: 'rgba(255,255,255,0.7)',
      shade: 'rgba(70,20,110,0.15)',
      ribbons: [
        ['#d9c4ff', '#f0e2ff'],
        ['#b79cff', '#dcc0ff'],
        ['#e39cdc', '#c3a0ff'],
        ['#f08cb4', '#d896e8'],
        ['#8a6cf0', '#cf86d8'],
      ],
    },
    dark: {
      bg: ['#0c0718', '#1a0f2e'],
      glow: 'rgba(190,120,255,0.28)',
      crest: 'rgba(230,190,255,0.3)',
      shade: 'rgba(0,0,0,0.45)',
      ribbons: [
        ['#3a2a7a', '#5a3c9c'],
        ['#4c2a86', '#7a3a96'],
        ['#6a2c80', '#9a3c78'],
        ['#3c2470', '#6a2e86'],
        ['#1e1650', '#3c2070'],
      ],
    },
  },
  dune: {
    light: {
      bg: ['#f6e6cf', '#fdf7ee'],
      glow: 'rgba(255,255,255,0.75)',
      crest: 'rgba(255,255,255,0.7)',
      shade: 'rgba(110,60,10,0.14)',
      ribbons: [
        ['#f2dcb8', '#faecd6'],
        ['#e9c590', '#f4dbb2'],
        ['#dea872', '#ecc48e'],
        ['#cf8c5c', '#e2a876'],
        ['#b46e48', '#cf8c60'],
      ],
    },
    dark: {
      bg: ['#120c06', '#22170c'],
      glow: 'rgba(255,180,100,0.22)',
      crest: 'rgba(255,220,170,0.26)',
      shade: 'rgba(0,0,0,0.5)',
      ribbons: [
        ['#5a3e22', '#7a5630'],
        ['#6a4426', '#8c5c32'],
        ['#74462a', '#966036'],
        ['#5e3622', '#7c4a2c'],
        ['#3a2216', '#58321e'],
      ],
    },
  },
  tide: {
    light: {
      bg: ['#c6e2ff', '#f2f8ff'],
      glow: 'rgba(255,255,255,0.8)',
      crest: 'rgba(255,255,255,0.75)',
      shade: 'rgba(10,50,130,0.16)',
      ribbons: [
        ['#9ee6ff', '#d0f4ff'],
        ['#5fcff5', '#9ee6ff'],
        ['#3aa8f0', '#5fd0f0'],
        ['#2f7ce6', '#4fb0f2'],
        ['#2552c8', '#3c88e8'],
      ],
    },
    dark: {
      bg: ['#020b1a', '#071a33'],
      glow: 'rgba(60,170,255,0.32)',
      crest: 'rgba(150,220,255,0.35)',
      shade: 'rgba(0,0,0,0.45)',
      ribbons: [
        ['#0f4a7a', '#1d74a8'],
        ['#0e5f8e', '#1f8ac0'],
        ['#0b6f9a', '#1a5fb0'],
        ['#173c94', '#2c66c8'],
        ['#0b1f5a', '#183c94'],
      ],
    },
  },
}

/** Blob geometry in view box units: center and radius, back to front. */
const BLOB_GEOMETRY: readonly (readonly [number, number, number])[] = [
  [0.14, 0.2, 760],
  [0.76, 0.16, 820],
  [0.5, 0.86, 860],
  [0.94, 0.7, 640],
  [0.26, 0.92, 600],
]

/** A ring of color around a lighter middle. */
const PRISM_GEOMETRY: readonly (readonly [number, number, number])[] = [
  [0.5, 0.08, 720],
  [0.08, 0.58, 700],
  [0.92, 0.5, 700],
  [0.32, 0.98, 620],
  [0.72, 0.96, 640],
]

const BLOBS: Readonly<Record<BlobPreset, Readonly<Record<Scheme, BlobPalette>>>> = {
  prism: {
    light: {
      geometry: PRISM_GEOMETRY,
      bg: ['#f6f3ff', '#fdf8fb'],
      glow: 'rgba(255,255,255,0.6)',
      blobs: [
        ['#ff9ad5', 0.8],
        ['#8fd3ff', 0.85],
        ['#ffe27a', 0.7],
        ['#a6f0c6', 0.75],
        ['#c3a2ff', 0.75],
      ],
    },
    dark: {
      geometry: PRISM_GEOMETRY,
      bg: ['#07061a', '#0d0a22'],
      glow: 'rgba(160,120,255,0.16)',
      blobs: [
        ['#ff3fa4', 0.55],
        ['#2d9cff', 0.6],
        ['#ffb800', 0.35],
        ['#20d38a', 0.5],
        ['#8b5cff', 0.55],
      ],
    },
  },
  aurora: {
    light: {
      bg: ['#e6efff', '#f6f1ff'],
      glow: 'rgba(255,255,255,0.55)',
      blobs: [
        ['#5ec8ff', 0.9],
        ['#a98bff', 0.8],
        ['#4fe0b8', 0.75],
        ['#7aa6ff', 0.8],
        ['#ffb3dc', 0.6],
      ],
    },
    dark: {
      bg: ['#03061a', '#080b26'],
      glow: 'rgba(80,120,255,0.18)',
      blobs: [
        ['#14c995', 0.7],
        ['#2f55ff', 0.75],
        ['#7d3cff', 0.65],
        ['#00a6cc', 0.6],
        ['#ff3d93', 0.38],
      ],
    },
  },
  bloom: {
    light: {
      bg: ['#fff0e6', '#fff8f2'],
      glow: 'rgba(255,255,255,0.55)',
      blobs: [
        ['#ff9a6b', 0.85],
        ['#ff86ba', 0.75],
        ['#ffc94d', 0.7],
        ['#b893ff', 0.65],
        ['#ff7676', 0.5],
      ],
    },
    dark: {
      bg: ['#10060d', '#1b0a16'],
      glow: 'rgba(255,120,90,0.16)',
      blobs: [
        ['#ff5a2a', 0.6],
        ['#e0307f', 0.65],
        ['#ffa600', 0.38],
        ['#6f3cff', 0.6],
        ['#ff3a3a', 0.38],
      ],
    },
  },
}

/** Style and motion of each preset. Animated presets list their moving layers. */
const PRESETS: Readonly<
  Record<
    WallpaperPreset,
    { style: 'ribbons' | 'blobs'; groups?: readonly { items: readonly number[]; motion: WallpaperMotion }[] }
  >
> = {
  bay: { style: 'ribbons' },
  sunrise: { style: 'ribbons' },
  meadow: { style: 'ribbons' },
  graphite: { style: 'ribbons' },
  lagoon: { style: 'ribbons' },
  dusk: { style: 'ribbons' },
  dune: { style: 'ribbons' },
  tide: {
    style: 'ribbons',
    groups: [
      { items: [0, 1, 2], motion: { duration: 36, x: 1.2, y: 2.4, scale: 1.02 } },
      { items: [3, 4], motion: { duration: 26, x: -1.8, y: -2.2, scale: 1 } },
    ],
  },
  aurora: {
    style: 'blobs',
    groups: [
      { items: [0, 3], motion: { duration: 48, x: 7, y: 5, scale: 1.12 } },
      { items: [1, 4], motion: { duration: 60, x: -8, y: 6, scale: 0.9 } },
      { items: [2], motion: { duration: 40, x: 5, y: -7, scale: 1.15 } },
    ],
  },
  prism: {
    style: 'blobs',
    groups: [
      { items: [0, 2], motion: { duration: 56, x: 6, y: 7, scale: 1.1 } },
      { items: [1, 3], motion: { duration: 46, x: 7, y: -6, scale: 1.12 } },
      { items: [4], motion: { duration: 38, x: -8, y: -5, scale: 0.92 } },
    ],
  },
  bloom: {
    style: 'blobs',
    groups: [
      { items: [0, 3], motion: { duration: 52, x: -6, y: 6, scale: 1.14 } },
      { items: [1, 4], motion: { duration: 44, x: 7, y: -5, scale: 0.9 } },
      { items: [2], motion: { duration: 64, x: -5, y: -6, scale: 1.1 } },
    ],
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

/** Markup of a layer before it is wrapped: definitions by id, and drawing. */
interface Part {
  defs: Map<string, string>
  body: string[]
}

function part(): Part {
  return { defs: new Map(), body: [] }
}

/**
 * Margin drawn around a moving layer, as a share of the frame on each side, so its
 * edges never come into view while it travels. The layer element extends past
 * the frame by the same share.
 */
export const OVERSCAN = 0.15

function svg(parts: readonly Part[], overscan = 0): string {
  const defs = new Map<string, string>()
  for (const { defs: own } of parts) for (const [id, markup] of own) defs.set(id, markup)
  const box = [-WIDTH * overscan, -HEIGHT * overscan, WIDTH * (1 + 2 * overscan), HEIGHT * (1 + 2 * overscan)]
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map(round).join(' ')}" preserveAspectRatio="xMidYMid slice">` +
    `<defs>${[...defs.values()].join('')}</defs>${parts.flatMap(p => p.body).join('')}</svg>`
  )
}

function base(bg: readonly [string, string], glow: string): Part {
  const p = part()
  p.defs.set(
    'b',
    `<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>`,
  )
  p.defs.set(
    'g',
    `<radialGradient id="g" gradientUnits="userSpaceOnUse" cx="${WIDTH * 0.22}" cy="${HEIGHT * 0.05}" r="${WIDTH * 0.7}"><stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`,
  )
  p.body.push(
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#b)"/>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>`,
  )
  return p
}

function ribbon(palette: RibbonPalette, k: number): Part {
  const [from, to] = palette.ribbons[k] ?? ['#000', '#000']
  const p = part()
  p.defs.set(
    's',
    '<filter id="s" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>',
  )
  p.defs.set(
    'f',
    '<filter id="f" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>',
  )
  p.defs.set(
    'c',
    '<filter id="c" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>',
  )
  p.defs.set(
    `r${k}`,
    `<linearGradient id="r${k}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${WIDTH}" y2="${HEIGHT * 0.4}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`,
  )
  p.defs.set(`p${k}`, `<path id="p${k}" d="${ribbonPath(crest(k))}"/>`)
  p.body.push(
    `<use href="#p${k}" fill="${palette.shade}" filter="url(#s)" transform="translate(0 -12)"/>`,
    `<use href="#p${k}" fill="url(#r${k})" fill-opacity="0.92" filter="url(#f)"/>`,
    `<use href="#p${k}" fill="none" stroke="${palette.crest}" stroke-width="2.5" filter="url(#c)"/>`,
  )
  return p
}

function blob(palette: BlobPalette, k: number, mirror: boolean): Part {
  const [color, strength] = palette.blobs[k] ?? ['#000', 0]
  const [x, y, r] = (palette.geometry ?? BLOB_GEOMETRY)[k] ?? [0.5, 0.5, 400]
  const cx = (mirror ? 1 - x : x) * WIDTH
  const cy = y * HEIGHT
  const p = part()
  p.defs.set(
    `o${k}`,
    `<radialGradient id="o${k}"><stop offset="0" stop-color="${color}" stop-opacity="${strength}"/>` +
      `<stop offset="0.45" stop-color="${color}" stop-opacity="${round(strength * 0.55)}"/>` +
      `<stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`,
  )
  p.body.push(`<circle cx="${round(cx)}" cy="${round(cy)}" r="${r}" fill="url(#o${k})"/>`)
  return p
}

/** The parts of a preset: the base first, then one part per ribbon or blob. */
function parts(preset: WallpaperPreset, scheme: Scheme): Part[] {
  if (PRESETS[preset].style === 'blobs') {
    const palette = BLOBS[preset as BlobPreset][scheme]
    return [base(palette.bg, palette.glow), ...palette.blobs.map((_, k) => blob(palette, k, preset === 'bloom'))]
  }
  const palette = RIBBONS[preset as RibbonPreset][scheme]
  return [base(palette.bg, palette.glow), ...palette.ribbons.map((_, k) => ribbon(palette, k))]
}

/**
 * Whether a preset moves.
 * @param preset - which wallpaper.
 * @returns true for animated presets.
 */
export function isAnimated(preset: WallpaperPreset): boolean {
  return PRESETS[preset].groups !== undefined
}

/**
 * Draw a wallpaper as one still image: the whole picture of a static preset, or
 * the first frame of an animated one.
 * @param preset - which wallpaper.
 * @param scheme - light or dark palette.
 * @returns standalone SVG markup with a 16:10 view box that covers any aspect ratio.
 */
export function wallpaperSvg(preset: WallpaperPreset, scheme: Scheme): string {
  return svg(parts(preset, scheme))
}

/**
 * The layers of a wallpaper. A static preset is one layer; an animated one is its
 * base, then one layer per group of ribbons or blobs that move together.
 * @param preset - which wallpaper.
 * @param scheme - light or dark palette.
 * @returns layers, back to front; the first never moves. Moving layers are drawn
 *   with {@link OVERSCAN} on every side.
 */
export function wallpaperLayers(preset: WallpaperPreset, scheme: Scheme): WallpaperLayer[] {
  const groups = PRESETS[preset].groups
  const all = parts(preset, scheme)
  if (!groups) return [{ svg: svg(all), motion: undefined }]
  const [first] = all
  const layers: WallpaperLayer[] = [{ svg: svg(first ? [first] : []), motion: undefined }]
  for (const group of groups) {
    const items = group.items.map(index => all[index + 1]).filter((item): item is Part => item !== undefined)
    layers.push({ svg: svg(items, OVERSCAN), motion: group.motion })
  }
  return layers
}

/**
 * Encode SVG markup as a data URL that is safe inside a double-quoted CSS `url()`
 * and a JavaScript string: no double quotes, no raw `%`, `#`, `<`, `>` or line breaks.
 * @param markup - SVG markup.
 * @returns a `data:image/svg+xml,` URL.
 */
export function svgDataUrl(markup: string): string {
  const encoded = markup
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
  return `data:image/svg+xml,${encoded}`
}

/**
 * A CSS image value for SVG markup.
 * @param markup - SVG markup.
 * @returns a `url("data:…")` value.
 */
export function svgImage(markup: string): string {
  return `url("${svgDataUrl(markup)}")`
}

const images = new Map<string, string>()

/**
 * The CSS image value of a built-in wallpaper, as one still image (cached).
 * @param preset - which wallpaper.
 * @param scheme - light or dark palette.
 * @returns a `url("data:…")` value.
 */
export function wallpaperImage(preset: WallpaperPreset, scheme: Scheme): string {
  const key = `${preset}|${scheme}`
  let image = images.get(key)
  if (image === undefined) {
    image = svgImage(wallpaperSvg(preset, scheme))
    images.set(key, image)
  }
  return image
}
