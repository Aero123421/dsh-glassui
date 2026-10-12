// The built Host half, exercised the way DSH calls it.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import * as host from '../../dist/index.js'
import { hostRows } from './fixture.mjs'

describe('Host half (dist/index.js)', () => {
  it('exports the plugin name matching cordis.patch.yml', () => {
    assert.equal(host.name, 'dsh-glassui')
  })

  it('validates settings with defaults', () => {
    const config = host.Config({})
    assert.equal(config.enabled.get(), true)
    assert.equal(config.tint.get(), 35)
    assert.equal(config.wallpaper.get(), 'auto')
    assert.throws(() => host.Config({ tint: 101 }))
    assert.throws(() => host.Config({ wallpaper: 'beach' }))
    assert.throws(() => host.Config({ exclude: 'x'.repeat(1001) }))
  })

  it('injects boot rows on every render, reading live values each time', async () => {
    assert.deepEqual(
      (await hostRows()).map(row => row.kind),
      ['global', 'style', 'script'],
    )
    const off = await hostRows({ enabled: false })
    assert.deepEqual(
      off.map(row => row.kind),
      ['global'],
    )
    assert.equal(off[0].value.settings.enabled, false)
    assert.equal(
      off[0].value.version,
      JSON.parse(await import('node:fs').then(fs => fs.readFileSync('package.json', 'utf8'))).version,
    )
  })

  it('subscribes to nothing but the index injection event', () => {
    const events = []
    host.apply({ on: event => events.push(event) }, host.Config({}))
    assert.deepEqual(events, ['webserver/index-inject'])
  })
})
