import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { WALLPAPER_PRESETS } from '../../src/shared/settings.ts'
import { svgDataUrl, wallpaperImage, wallpaperSvg } from '../../src/shared/wallpapers.ts'

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
