import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
import * as host from '../../dist/index.js'
function fixture(config = {}) {
  const routes = new Map(),
    effects = []
  const ctx = {
    on: () => {},
    get: () => undefined,
    effect: setup => effects.push(setup()),
    inject: (_names, setup) => setup({ connection: { fetch: { register: route => routes.set(route.path, route) } } }),
  }
  host.apply(ctx, host.Config(config))
  return { routes, dispose: () => effects.forEach(dispose => dispose()) }
}
async function call(routes, method, payload = {}) {
  const endpoint = `dsh-glassui/update-${method}`
  const response = await routes.get('/api/' + endpoint).fetch(
    new Request('http://localhost/api/' + endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', method: endpoint, rpcId: 'test', payload }),
    }),
  )
  return response.json()
}
test('optional manager leaves boot and settings working; authenticated route shape and errors are bounded', async t => {
  const { routes, dispose } = fixture()
  t.after(dispose)
  assert.equal(routes.size, 5)
  assert.equal(routes.has('/api/dsh-glassui/update-restore'), true)
  const result = await call(routes, 'status')
  assert.equal(result.result.value.status, 'blocked')
  assert.equal(result.result.value.reason, 'manager-unavailable')
  assert.equal(result.result.value.runtimeVersion, version)
  const failure = await call(routes, 'begin', { settings: { tint: 'invalid' }, candidateId: 'x', requestId: 'x' })
  assert.equal(failure.result.error.code, 'dsh-glassui/invalid-request')
  assert.equal(JSON.stringify(failure).includes('invalid'), true)
  const restore = await call(routes, 'restore', {})
  assert.equal(restore.result.ok, false)
  assert.equal(restore.result.error.code, 'dsh-glassui/profile')
  assert.equal(JSON.stringify(restore).includes('restored'), false)
  const malformed = await routes
    .get('/api/dsh-glassui/update-status')
    .fetch(new Request('http://localhost', { method: 'POST', body: '{}' }))
  assert.equal(malformed.status, 415)
})
test('an unavailable manager is named instead of a generic update failure', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'glassui-route-'))
  const profileKey = createHash('sha256')
    .update(`dsh-glassui\0${resolve(dir)}`)
    .digest('hex')
  const routes = new Map()
  const ctx = {
    on: () => {},
    get: name => {
      if (name === 'profileContext') return { dir }
      if (name === 'pluginManager') {
        return {
          listBundles: async () => [
            {
              name: 'dsh-glassui',
              installed: true,
              version: '0.2.6',
              source: 'github:Aero123421/dsh-glassui#v0.2.6',
              enabled: true,
            },
          ],
          installBundle: async () => ({}),
          waitForInstall: async () => null,
        }
      }
      return undefined
    },
    effect: () => {},
    inject: (_names, setup) => setup({ connection: { fetch: { register: route => routes.set(route.path, route) } } }),
  }
  host.apply(ctx, host.Config({}))
  const failure = await call(routes, 'begin', {
    settings: {
      enabled: true,
      tint: 35,
      wallpaper: 'auto',
      wallpaperUrl: '',
      sidebar: 'floating',
      codeBlocks: 'glass',
      inlineCodeOpacity: 72,
      refraction: true,
      highlights: true,
      exclude: '',
    },
    candidateId: 'release',
    requestId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    profileKey,
  })
  assert.equal(failure.result.ok, false)
  assert.equal(failure.result.error.code, 'dsh-glassui/manager-unavailable')
})
test('another client setting change refuses update admission before any installation', async t => {
  const { routes, dispose } = fixture({ tint: 37 })
  t.after(dispose)
  const failure = await call(routes, 'begin', {
    settings: {
      enabled: true,
      tint: 35,
      wallpaper: 'auto',
      wallpaperUrl: '',
      sidebar: 'floating',
      codeBlocks: 'glass',
      inlineCodeOpacity: 72,
      refraction: true,
      highlights: true,
      exclude: '',
    },
    candidateId: 'x',
    requestId: 'x',
  })
  assert.equal(failure.result.error.code, 'dsh-glassui/settings')
})
