import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { STEPS_PER_SECOND, motionKeyframes, resolveWallpaper } from '../../src/client/engine/wallpaper.ts'
import { normalizeSettings } from '../../src/shared/settings.ts'
import { OVERSCAN, wallpaperImage } from '../../src/shared/wallpapers.ts'

describe('motionKeyframes', () => {
  const frames = motionKeyframes({ duration: 40, x: 6.5, y: -3.9, scale: 1.1 })

  it('starts at rest, so the first frame matches the still picture', () => {
    const [first] = frames
    assert.ok(first)
    assert.equal(first.offset, 0)
    assert.equal(first.transform, 'translate(0%, 0%) scale(1)')
  })

  it('ends at the full travel, expressed relative to the larger layer', () => {
    const size = 1 + 2 * OVERSCAN
    const last = frames.at(-1)
    assert.ok(last)
    assert.equal(last.offset, 1)
    assert.equal(
      last.transform,
      `translate(${Math.round((6.5 / size) * 1000) / 1000}%, ${Math.round((-3.9 / size) * 1000) / 1000}%) scale(1.1)`,
    )
  })

  it('eases in and out', () => {
    const offsets = frames.map(frame => frame.offset)
    assert.deepEqual(offsets, [0, 0.2, 0.5, 0.8, 1])
  })

  it('updates a dozen times a second', () => {
    assert.equal(STEPS_PER_SECOND, 12)
  })
})

describe('resolveWallpaper', () => {
  it('resolves presets with their still picture', () => {
    const resolved = resolveWallpaper(normalizeSettings({ wallpaper: 'aurora' }), 'dark', false)
    assert.deepEqual(resolved, { name: 'aurora', image: wallpaperImage('aurora', 'dark'), preset: 'aurora' })
  })

  it('uses Bay automatically, except in the macOS app', () => {
    assert.equal(resolveWallpaper(normalizeSettings({ wallpaper: 'auto' }), 'light', false)?.preset, 'bay')
    assert.equal(resolveWallpaper(normalizeSettings({ wallpaper: 'auto' }), 'light', true), undefined)
  })

  it('accepts only safe custom URLs', () => {
    assert.equal(
      resolveWallpaper(
        normalizeSettings({ wallpaper: 'custom', wallpaperUrl: 'https://example.com/a.jpg' }),
        'light',
        false,
      )?.image,
      'url("https://example.com/a.jpg")',
    )
    assert.equal(
      resolveWallpaper(normalizeSettings({ wallpaper: 'custom', wallpaperUrl: 'javascript:alert(1)' }), 'light', false),
      undefined,
    )
  })
})
