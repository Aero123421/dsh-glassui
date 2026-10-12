import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { runInNewContext } from 'node:vm'
import { bootRows, type BootRow } from '../../src/host/boot.ts'
import { BOOT_GLOBAL, normalizeSettings, type GlassSettings } from '../../src/shared/settings.ts'
import { buildStylesheet } from '../../src/shared/stylesheet.ts'
import { wallpaperImage } from '../../src/shared/wallpapers.ts'

interface FakePage {
  attributes: Map<string, string>
  properties: Map<string, string>
  warnings: unknown[][]
}

/** Run the boot script against a minimal DOM. */
function boot(
  settings: Partial<GlassSettings>,
  page: { dark?: boolean; platform?: string; forcedColors?: boolean; body?: boolean } = {},
): FakePage {
  const rows = bootRows(normalizeSettings({ ...settings, enabled: true }), '1.2.3')
  const script = rows.find((row): row is Extract<BootRow, { kind: 'script' }> => row.kind === 'script')
  assert.ok(script)
  const attributes = new Map<string, string>()
  if (page.platform) attributes.set('data-platform', page.platform)
  const properties = new Map<string, string>()
  const warnings: unknown[][] = []
  const documentElement = {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    style: { setProperty: (name: string, value: string) => properties.set(name, value) },
  }
  const body = { hasAttribute: (name: string) => name === 'data-ds-dark-theme' && page.dark === true }
  runInNewContext(script.text, {
    document: { documentElement, body: page.body === false ? null : body },
    window: {
      matchMedia: (query: string) => ({ matches: query.includes('forced-colors') && page.forcedColors === true }),
    },
    console: { warn: (...args: unknown[]) => warnings.push(args) },
  })
  return { attributes, properties, warnings }
}

describe('bootRows', () => {
  it('emits only the settings global when the material is off', () => {
    const settings = normalizeSettings({ enabled: false })
    assert.deepEqual(bootRows(settings, '1.2.3'), [
      { kind: 'global', name: BOOT_GLOBAL, value: { version: '1.2.3', settings } },
    ])
  })

  it('emits the global, the stylesheet and a body script when on', () => {
    const rows = bootRows(normalizeSettings({}), '1.2.3')
    assert.deepEqual(
      rows.map(row => row.kind),
      ['global', 'style', 'script'],
    )
    assert.deepEqual(rows[1], { kind: 'style', text: buildStylesheet() })
    assert.equal((rows[2] as Extract<BootRow, { kind: 'script' }>).placement, 'body')
  })

  it('produces JSON-serializable rows', () => {
    const rows = bootRows(normalizeSettings({ wallpaper: 'custom', wallpaperUrl: 'https://example.com/a.png' }), '1')
    assert.deepEqual(JSON.parse(JSON.stringify(rows)), rows)
  })

  it('never lets settings close the script element', () => {
    for (const wallpaperUrl of ['https://example.com/</script>.png', '/a</ScRiPt><script>alert(1)</script>']) {
      const rows = bootRows(normalizeSettings({ wallpaper: 'custom', wallpaperUrl, exclude: '</script>' }), '1')
      for (const row of rows) {
        if (row.kind !== 'global') assert.doesNotMatch(row.text, /<\/script/i)
      }
    }
  })
})

describe('boot script', () => {
  it('marks the root and sets the tint and sidebar', () => {
    const page = boot({ tint: 60, sidebar: 'docked', wallpaper: 'none' })
    assert.equal(page.attributes.get('data-glassui'), 'on')
    assert.equal(page.attributes.get('data-glassui-sidebar'), 'docked')
    assert.equal(page.properties.get('--glassui-t'), '0.6')
    assert.equal(page.attributes.has('data-glassui-wallpaper'), false)
    assert.deepEqual(page.warnings, [])
  })

  it('paints Bay automatically in a browser, in the current palette', () => {
    const light = boot({ wallpaper: 'auto' })
    assert.equal(light.attributes.get('data-glassui-wallpaper'), 'bay')
    assert.equal(light.properties.get('--glassui-wallpaper'), wallpaperImage('bay', 'light'))
    const dark = boot({ wallpaper: 'auto' }, { dark: true })
    assert.equal(dark.properties.get('--glassui-wallpaper'), wallpaperImage('bay', 'dark'))
  })

  it('leaves the macOS app’s vibrancy alone on auto, but not for an explicit choice', () => {
    assert.equal(boot({ wallpaper: 'auto' }, { platform: 'darwin' }).attributes.has('data-glassui-wallpaper'), false)
    assert.equal(
      boot({ wallpaper: 'meadow' }, { platform: 'darwin' }).attributes.get('data-glassui-wallpaper'),
      'meadow',
    )
  })

  it('uses a safe custom URL and ignores an unsafe one', () => {
    const safe = boot({ wallpaper: 'custom', wallpaperUrl: 'https://example.com/a.jpg' })
    assert.equal(safe.properties.get('--glassui-wallpaper'), 'url("https://example.com/a.jpg")')
    const unsafe = boot({ wallpaper: 'custom', wallpaperUrl: 'javascript:alert(1)' })
    assert.equal(unsafe.attributes.has('data-glassui-wallpaper'), false)
    assert.equal(unsafe.attributes.get('data-glassui'), 'on')
  })

  it('does nothing in forced-colors mode', () => {
    const page = boot({}, { forcedColors: true })
    assert.equal(page.attributes.size, 0)
    assert.equal(page.properties.size, 0)
  })

  it('tolerates a missing <body>', () => {
    const page = boot({ wallpaper: 'bay' }, { body: false })
    assert.equal(page.properties.get('--glassui-wallpaper'), wallpaperImage('bay', 'light'))
  })
})
