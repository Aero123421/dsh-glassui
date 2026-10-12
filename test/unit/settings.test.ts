import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_SETTINGS,
  MAX_EXCLUDE_LENGTH,
  MAX_WALLPAPER_URL_LENGTH,
  isSafeWallpaperUrl,
  normalizeSettings,
  sameSettings,
} from '../../src/shared/settings.ts'

describe('normalizeSettings', () => {
  it('returns the defaults for anything that is not an object', () => {
    for (const input of [undefined, null, 42, 'on', [], true]) {
      assert.deepEqual(normalizeSettings(input), DEFAULT_SETTINGS)
    }
  })

  it('returns a fresh object every time', () => {
    const a = normalizeSettings({})
    a.tint = 99
    assert.equal(normalizeSettings({}).tint, DEFAULT_SETTINGS.tint)
  })

  it('keeps valid fields and drops unknown ones', () => {
    const expected = {
      enabled: false,
      tint: 80,
      wallpaper: 'meadow',
      wallpaperUrl: 'https://example.com/a.jpg',
      sidebar: 'docked',
      codeBlocks: 'solid',
      refraction: false,
      highlights: false,
      exclude: '.terminal',
    }
    assert.deepEqual(normalizeSettings({ ...expected, extra: 'ignored' }), expected)
  })

  it('falls back field by field', () => {
    const result = normalizeSettings({
      enabled: 'yes',
      tint: 'high',
      wallpaper: 'beach',
      sidebar: 'left',
      codeBlocks: 'clear',
      exclude: 7,
    })
    assert.deepEqual(result, DEFAULT_SETTINGS)
  })

  it('rounds and clamps the tint', () => {
    assert.equal(normalizeSettings({ tint: 42.6 }).tint, 43)
    assert.equal(normalizeSettings({ tint: -5 }).tint, 0)
    assert.equal(normalizeSettings({ tint: 250 }).tint, 100)
    assert.equal(normalizeSettings({ tint: Number.NaN }).tint, DEFAULT_SETTINGS.tint)
    assert.equal(normalizeSettings({ tint: Number.POSITIVE_INFINITY }).tint, DEFAULT_SETTINGS.tint)
  })

  it('trims text and rejects oversized text', () => {
    assert.equal(normalizeSettings({ exclude: '  .a, .b  ' }).exclude, '.a, .b')
    assert.equal(normalizeSettings({ exclude: 'x'.repeat(MAX_EXCLUDE_LENGTH + 1) }).exclude, '')
    assert.equal(normalizeSettings({ wallpaperUrl: 'x'.repeat(MAX_WALLPAPER_URL_LENGTH + 1) }).wallpaperUrl, '')
  })
})

describe('sameSettings', () => {
  it('compares every field', () => {
    const base = normalizeSettings({})
    assert.equal(sameSettings(base, { ...base }), true)
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[]) {
      const changed = { ...base, [key]: key === 'tint' ? 1 : typeof base[key] === 'boolean' ? !base[key] : 'other' }
      assert.equal(sameSettings(base, changed), false, key)
    }
  })
})

describe('isSafeWallpaperUrl', () => {
  it('accepts web URLs, paths and raster data URLs', () => {
    for (const url of [
      'https://example.com/wallpaper.jpg',
      'http://localhost:8080/a.png?size=2x&v=1',
      '/files/wallpaper.webp',
      './wallpaper.png',
      '../images/wallpaper.avif',
      'data:image/png;base64,iVBORw0KGgo=',
      'data:image/jpeg;base64,/9j/4AAQ',
    ]) {
      assert.equal(isSafeWallpaperUrl(url), true, url)
    }
  })

  it('rejects anything that could escape url() or run code', () => {
    for (const url of [
      '',
      'javascript:alert(1)',
      'data:image/svg+xml,<svg/>',
      'data:image/svg+xml;base64,PHN2Zy8+',
      'data:text/html;base64,PGh0bWw+',
      '//evil.example/a.png',
      'https://example.com/a.png") ; background: red',
      "https://example.com/a'.png",
      'https://example.com/a (1).png',
      'https://example.com/a\\.png',
      'https://example.com/<a>.png',
      'file:///etc/passwd',
      'ftp://example.com/a.png',
      'wallpaper.png',
      `https://example.com/${'a'.repeat(MAX_WALLPAPER_URL_LENGTH)}`,
    ]) {
      assert.equal(isSafeWallpaperUrl(url), false, url)
    }
  })
})
