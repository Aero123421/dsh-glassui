import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { WALLPAPER_PRESETS, type WallpaperPreset } from '../../src/shared/settings.ts'
import {
  OVERSCAN,
  isAnimated,
  svgDataUrl,
  wallpaperImage,
  wallpaperLayers,
  wallpaperSvg,
} from '../../src/shared/wallpapers.ts'

const SCHEMES = ['light', 'dark'] as const

describe('wallpaperSvg', () => {
  it('is deterministic', () => {
    for (const preset of WALLPAPER_PRESETS) {
      for (const scheme of SCHEMES) assert.equal(wallpaperSvg(preset, scheme), wallpaperSvg(preset, scheme))
    }
  })

  it('draws a distinct picture per preset and scheme', () => {
    const all = WALLPAPER_PRESETS.flatMap(preset => SCHEMES.map(scheme => wallpaperSvg(preset, scheme)))
    assert.equal(new Set(all).size, all.length)
  })

  it('is a standalone SVG that covers any aspect ratio', () => {
    const svg = wallpaperSvg('bay', 'light')
    assert.match(
      svg,
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+" preserveAspectRatio="xMidYMid slice">/,
    )
    assert.match(svg, /<\/svg>$/)
    assert.doesNotMatch(svg, /<(?:script|foreignObject|image)\b/i)
    assert.doesNotMatch(svg, /\b(?:href|src)="(?!#)/)
  })

  it('stays small enough to embed in every page', () => {
    for (const preset of WALLPAPER_PRESETS) {
      for (const scheme of SCHEMES) assert.ok(wallpaperImage(preset, scheme).length < 12_000, `${preset}/${scheme}`)
    }
  })
})

describe('wallpaperLayers', () => {
  const ANIMATED: readonly WallpaperPreset[] = ['tide', 'aurora', 'bloom', 'prism']

  it('marks exactly the moving presets as animated', () => {
    assert.deepEqual(
      WALLPAPER_PRESETS.filter(preset => isAnimated(preset)),
      ANIMATED,
    )
  })

  it('draws a still preset as one layer, the same as its picture', () => {
    for (const preset of WALLPAPER_PRESETS.filter(preset => !isAnimated(preset))) {
      for (const scheme of SCHEMES) {
        const layers = wallpaperLayers(preset, scheme)
        const [layer] = layers
        assert.equal(layers.length, 1)
        assert.ok(layer)
        assert.equal(layer.svg, wallpaperSvg(preset, scheme))
        assert.equal(layer.motion, undefined)
      }
    }
  })

  it('splits a moving preset into a still base and moving layers holding every shape once', () => {
    const shapes = (markup: string): number => (markup.match(/<(?:use href="#p\d+" fill="url|circle )/g) ?? []).length
    for (const preset of ANIMATED) {
      for (const scheme of SCHEMES) {
        const [base, ...moving] = wallpaperLayers(preset, scheme)
        assert.ok(base && base.motion === undefined, preset)
        assert.equal(shapes(base.svg), 0, `${preset}: the base holds no shapes`)
        assert.ok(moving.length >= 2, preset)
        const total = moving.reduce((sum, layer) => sum + shapes(layer.svg), 0)
        assert.equal(total, shapes(wallpaperSvg(preset, scheme)), `${preset}/${scheme}`)
        for (const layer of moving) assert.ok(layer.motion, preset)
      }
    }
  })

  it('draws moving layers with an overscan margin', () => {
    const [, layer] = wallpaperLayers('aurora', 'light')
    const margin = (n: number): string => String(Math.round(n * OVERSCAN * 10) / 10)
    assert.ok(layer?.svg.includes(`viewBox="-${margin(1600)} -${margin(1000)} `), layer?.svg.slice(0, 160))
  })

  it('keeps every moving layer’s edges outside the frame and on one step clock', () => {
    for (const preset of ANIMATED) {
      for (const layer of wallpaperLayers(preset, 'light').slice(1)) {
        const motion = layer.motion
        assert.ok(motion)
        assert.ok(Number.isInteger(motion.duration) && motion.duration >= 20, `${preset}: ${motion.duration}s`)
        // Travel plus the inward pull of shrinking, in percent of the frame, stays within the margin.
        const pull = Math.max(0, 1 - motion.scale) * (50 + OVERSCAN * 100)
        for (const travel of [motion.x, motion.y]) {
          assert.ok(Math.abs(travel) + pull <= OVERSCAN * 100, `${preset}: ${travel}% + ${pull.toFixed(1)}%`)
        }
      }
    }
  })
})

describe('svgDataUrl / wallpaperImage', () => {
  it('encodes every character that could end a CSS url() or an HTML element', () => {
    for (const preset of WALLPAPER_PRESETS) {
      for (const scheme of SCHEMES) {
        const url = svgDataUrl(wallpaperSvg(preset, scheme))
        assert.ok(url.startsWith('data:image/svg+xml,'))
        assert.doesNotMatch(url, /["<>#\n\r]/)
        assert.doesNotMatch(url, /%(?![0-9A-F]{2})/)
      }
    }
  })

  it('round-trips through URI decoding', () => {
    const svg = '<svg a="1"><g id="x"/><use href="#x" width="50%"/></svg>'
    const decoded = decodeURIComponent(svgDataUrl(svg).slice('data:image/svg+xml,'.length))
    assert.equal(decoded, svg.replace(/"/g, "'"))
  })

  it('wraps the data URL in a quoted url()', () => {
    assert.match(wallpaperImage('meadow', 'dark'), /^url\("data:image\/svg\+xml,[^"]+"\)$/)
  })
})
