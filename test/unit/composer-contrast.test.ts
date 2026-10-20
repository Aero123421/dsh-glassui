import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/**
 * Contrast of the model button for the 16 glass-on conditions.
 *
 * The 0.2.5 column uses the model-button backgrounds measured on DSH 0.2.1-rc.2
 * with glassui 0.2.5 (50ef173), when the composer alpha was 0.74 in both themes.
 * 0.2.4 and 0.2.6 reblend each sample to that condition's composer alpha.
 * Light fill is white. Dark fill is fitted from the two dark-black endpoints
 * QA measured: #0d0d11 at alpha 0.16 and #232325 at alpha 0.74. The 1017 badge
 * sits on a wash of the accent over that surface; the wash fraction is the one
 * that reproduces the 0.2.5 black, tint 0 readings (light 2.68, dark 5.75).
 * This is not a new screenshot.
 */

type Rgb = readonly [number, number, number]
type Scheme = 'light' | 'dark'
type Era = '0.2.4' | '0.2.5' | '0.2.6'

const HIGH: Record<Scheme, Rgb> = {
  light: [173, 178, 184],
  dark: [129, 133, 140],
}
/** 0.2.5 and 0.2.6 model name. 0.2.4 used DSH's secondary gray. */
const NAME: Record<Era, Record<Scheme, Rgb>> = {
  '0.2.4': { light: [97, 102, 107], dark: [207, 211, 214] },
  '0.2.5': { light: [79, 84, 89], dark: [200, 204, 212] },
  '0.2.6': { light: [79, 84, 89], dark: [200, 204, 212] },
}
const ACCENT: Record<Scheme, Rgb> = {
  light: [65, 118, 230],
  dark: [122, 170, 255],
}
const BADGE_WASH: Record<Scheme, number> = { light: 0.103, dark: 0.089 }

/** Model-button background at composer alpha 0.74, from the 0.2.5 screen. */
const MEASURED: readonly { scheme: Scheme; tint: 0 | 35; wallpaper: string; background: Rgb }[] = [
  { scheme: 'light', tint: 0, wallpaper: 'bay', background: [223, 243, 254] },
  { scheme: 'light', tint: 0, wallpaper: 'white', background: [255, 255, 254] },
  { scheme: 'light', tint: 0, wallpaper: 'gray', background: [237, 237, 236] },
  { scheme: 'light', tint: 0, wallpaper: 'black', background: [216, 216, 215] },
  { scheme: 'light', tint: 35, wallpaper: 'bay', background: [232, 248, 254] },
  { scheme: 'light', tint: 35, wallpaper: 'white', background: [255, 255, 254] },
  { scheme: 'light', tint: 35, wallpaper: 'gray', background: [243, 243, 242] },
  { scheme: 'light', tint: 35, wallpaper: 'black', background: [228, 229, 228] },
  { scheme: 'dark', tint: 0, wallpaper: 'bay', background: [40, 51, 84] },
  { scheme: 'dark', tint: 0, wallpaper: 'white', background: [76, 76, 79] },
  { scheme: 'dark', tint: 0, wallpaper: 'gray', background: [56, 56, 59] },
  { scheme: 'dark', tint: 0, wallpaper: 'black', background: [35, 35, 38] },
  { scheme: 'dark', tint: 35, wallpaper: 'bay', background: [39, 48, 72] },
  { scheme: 'dark', tint: 35, wallpaper: 'white', background: [65, 65, 68] },
  { scheme: 'dark', tint: 35, wallpaper: 'gray', background: [51, 51, 53] },
  { scheme: 'dark', tint: 35, wallpaper: 'black', background: [36, 36, 39] },
]

function linear(channel: number): number {
  const s = channel / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function luminance(rgb: Rgb): number {
  return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2])
}

function contrast(ink: Rgb, background: Rgb): number {
  const a = luminance(ink)
  const b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** `--glassui-fill-a` at tint 0 or 35, with the floor at 0. */
function fillAlpha(tint: number): number {
  return 0.16 + (tint / 100) * 0.62
}

function composerAlpha(scheme: Scheme, tint: number, era: Era): number {
  const fill = fillAlpha(tint)
  if (era === '0.2.4') return fill
  if (era === '0.2.5') return Math.max(0.74, fill)
  return scheme === 'light' ? Math.max(0.74, fill) : fill
}

function mix(alpha: number, fore: Rgb, back: Rgb): Rgb {
  return [
    alpha * fore[0] + (1 - alpha) * back[0],
    alpha * fore[1] + (1 - alpha) * back[1],
    alpha * fore[2] + (1 - alpha) * back[2],
  ]
}

/** Dark effective fill from #0d0d11 at 0.16 and #232325 at 0.74. */
function darkFill(): Rgb {
  const low: Rgb = [13, 13, 17]
  const high: Rgb = [35, 35, 37]
  const lowA = 0.16
  const highA = 0.74
  const scale = lowA - highA
  const channel = (index: 0 | 1 | 2): number => (low[index] * (1 - highA) - high[index] * (1 - lowA)) / scale
  return [channel(0), channel(1), channel(2)]
}

const LIGHT_FILL: Rgb = [255, 255, 255]
const DARK_FILL = darkFill()

function backdrop(fill: Rgb, sample: Rgb, sampleAlpha: number): Rgb {
  const rest = 1 - sampleAlpha
  const channel = (index: 0 | 1 | 2): number => (sample[index] - sampleAlpha * fill[index]) / rest
  return [channel(0), channel(1), channel(2)]
}

function surface(scheme: Scheme, tint: number, sample: Rgb, era: Era): Rgb {
  if (era === '0.2.5') return sample
  const fill = scheme === 'light' ? LIGHT_FILL : DARK_FILL
  return mix(composerAlpha(scheme, tint, era), fill, backdrop(fill, sample, 0.74))
}

function badgeBackground(scheme: Scheme, ground: Rgb): Rgb {
  return mix(BADGE_WASH[scheme], ACCENT[scheme], ground)
}

interface Ratios {
  high: number
  badge: number
  name: number
}

function ratios(scheme: Scheme, ground: Rgb, era: Era): Ratios {
  return {
    high: contrast(HIGH[scheme], ground),
    badge: contrast(ACCENT[scheme], badgeBackground(scheme, ground)),
    name: contrast(NAME[era][scheme], ground),
  }
}

function row(scheme: Scheme, tint: 0 | 35, wallpaper: string): (typeof MEASURED)[number] {
  const found = MEASURED.find(item => item.scheme === scheme && item.tint === tint && item.wallpaper === wallpaper)
  assert.ok(found)
  return found
}

describe('composer contrast across the 16 conditions', () => {
  it('keeps the light black tint-0 exception and restores dark black High to at least 4.5', () => {
    const lightBlack = ratios('light', surface('light', 0, row('light', 0, 'black').background, '0.2.6'), '0.2.6')
    assert.equal(lightBlack.high.toFixed(2), '1.50')
    assert.ok(lightBlack.high < 3)
    assert.equal(lightBlack.name.toFixed(2), '5.36')
    assert.ok(lightBlack.name >= 4.76)

    for (const tint of [0, 35] as const) {
      const darkBlack = ratios('dark', surface('dark', tint, row('dark', tint, 'black').background, '0.2.6'), '0.2.6')
      assert.ok(darkBlack.high >= 4.5, `dark black tint ${tint} High ${darkBlack.high}`)
    }
    assert.equal(
      ratios('dark', surface('dark', 0, row('dark', 0, 'black').background, '0.2.6'), '0.2.6').high.toFixed(2),
      '5.22',
    )
    assert.equal(
      ratios('dark', surface('dark', 35, row('dark', 35, 'black').background, '0.2.6'), '0.2.6').high.toFixed(2),
      '4.79',
    )
  })

  it('matches the measured regression anchors', () => {
    const anchors: { scheme: Scheme; tint: 0 | 35; era: Era; high: number; badge: number; name: number }[] = [
      { scheme: 'light', tint: 0, era: '0.2.4', high: 1.82, badge: 1.08, name: 1.49 },
      { scheme: 'light', tint: 0, era: '0.2.5', high: 1.5, badge: 2.68, name: 5.36 },
      { scheme: 'dark', tint: 0, era: '0.2.4', high: 5.23, badge: 7.24, name: 12.88 },
      { scheme: 'dark', tint: 0, era: '0.2.5', high: 4.23, badge: 5.75, name: 9.74 },
      { scheme: 'dark', tint: 35, era: '0.2.4', high: 4.83, badge: 6.51, name: 11.77 },
      { scheme: 'dark', tint: 35, era: '0.2.5', high: 4.23, badge: 5.67, name: 9.62 },
    ]
    for (const anchor of anchors) {
      const got = ratios(
        anchor.scheme,
        surface(anchor.scheme, anchor.tint, row(anchor.scheme, anchor.tint, 'black').background, anchor.era),
        anchor.era,
      )
      // 0.2.5 tint 35 black on screen is (36, 36, 39); QA read the same floor as #232325 (4.23).
      assert.ok(
        Math.abs(got.high - anchor.high) <= 0.06,
        `${anchor.era} ${anchor.scheme} ${anchor.tint} High ${got.high}`,
      )
      assert.ok(
        Math.abs(got.name - anchor.name) <= 0.05,
        `${anchor.era} ${anchor.scheme} ${anchor.tint} name ${got.name}`,
      )
      assert.ok(
        Math.abs(got.badge - anchor.badge) <= 0.2,
        `${anchor.era} ${anchor.scheme} ${anchor.tint} badge ${got.badge}`,
      )
    }
  })

  it('leaves every light condition at the 0.2.5 value', () => {
    for (const sample of MEASURED.filter(item => item.scheme === 'light')) {
      const previous = ratios('light', surface('light', sample.tint, sample.background, '0.2.5'), '0.2.5')
      const next = ratios('light', surface('light', sample.tint, sample.background, '0.2.6'), '0.2.6')
      assert.deepEqual(next, previous, `${sample.tint} ${sample.wallpaper}`)
    }
  })

  it('cannot raise light black tint-0 High to 1.82 without dropping the model name under 4.76', () => {
    // 0.2.4's 1.82 is the darker side of the caption, at the normal fill (alpha 0.16).
    const darker = ratios('light', surface('light', 0, row('light', 0, 'black').background, '0.2.4'), '0.2.6')
    assert.ok(darker.high >= 1.82, darker.high.toFixed(2))
    assert.ok(darker.name < 4.76, darker.name.toFixed(2))
    assert.equal(darker.name.toFixed(2), '1.96')
  })

  it('drops the model-name minimum below 5.32 and below 4.76 on dark white', () => {
    let minimum = Number.POSITIVE_INFINITY
    let where = ''
    const under: string[] = []
    for (const sample of MEASURED) {
      const name = ratios(sample.scheme, surface(sample.scheme, sample.tint, sample.background, '0.2.6'), '0.2.6').name
      const label = `${sample.scheme} ${sample.tint} ${sample.wallpaper}`
      if (name < minimum) {
        minimum = name
        where = label
      }
      if (name < 4.76) under.push(`${label} ${name.toFixed(2)}`)
    }
    assert.equal(where, 'dark 0 white')
    assert.equal(minimum.toFixed(2), '1.93')
    assert.ok(minimum < 4.76)
    assert.deepEqual(under.sort(), ['dark 0 white 1.93', 'dark 35 white 4.06'])
  })
})
