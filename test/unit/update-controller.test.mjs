import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rejectedReason, UpdateController } from '../../src/client/update-controller.mjs'
import { DEFAULT_SETTINGS } from '../../src/shared/settings.ts'
function storage() {
  const map = new Map()
  return {
    getItem: key => map.get(key),
    setItem: (key, value) => map.set(key, value),
    removeItem: key => map.delete(key),
  }
}
const profileKey = 'a'.repeat(64)
const candidate = { id: 'release', version: '0.3.0' }
test('update waits for real settings settlement and rejected save never sends begin', async () => {
  let finish,
    requests = 0,
    released = false
  const saved = storage(),
    gate = new Promise(resolve => {
      finish = resolve
    })
  const controller = new UpdateController(
    {
      rpc: {
        call: async (_base, method, payload) => {
          if (method.endsWith('begin')) {
            requests++
            assert.deepEqual(payload.settings, DEFAULT_SETTINGS)
            return { ok: true, value: { requestId: payload.requestId, status: 'restart-required' } }
          }
          return { ok: true, value: { status: 'restart-required', profileKey } }
        },
      },
    },
    async () => {
      await gate
      return () => {
        released = true
      }
    },
    () => DEFAULT_SETTINGS,
    saved,
  )
  controller.publish({ status: 'available', candidate, profileKey })
  const pending = controller.begin()
  await controller.begin()
  assert.equal(requests, 0)
  assert.equal(controller.state.status, 'settling')
  finish()
  await pending
  assert.equal(requests, 1)
  assert.equal(released, true)
  controller.dispose()
  const rejected = new UpdateController(
    {
      rpc: {
        call: () => {
          throw new Error('must not send')
        },
      },
    },
    async () => {
      throw new Error('settings')
    },
    () => DEFAULT_SETTINGS,
    storage(),
  )
  rejected.publish({ status: 'available', candidate, profileKey })
  await rejected.begin()
  assert.equal(rejected.state.status, 'failed')
  assert.equal(rejected.state.reason, 'settings')
  rejected.dispose()
})
test('a stale update candidate is named, and an unknown RPC failure stays a network error', async () => {
  assert.equal(rejectedReason(new Error('dsh-glassui/stale-candidate')), 'stale-candidate')
  assert.equal(rejectedReason(new Error('dsh-glassui/update-failed')), 'network')
  assert.equal(rejectedReason(new Error('socket hang up')), 'network')
  const controller = new UpdateController(
    {
      rpc: {
        call: async () => ({ ok: false, error: { code: 'dsh-glassui/stale-candidate', message: 'stale-candidate' } }),
      },
    },
    async () => () => {},
    () => DEFAULT_SETTINGS,
    storage(),
  )
  controller.publish({ status: 'available', candidate, profileKey })
  await controller.begin()
  assert.equal(controller.state.status, 'failed')
  assert.equal(controller.state.reason, 'stale-candidate')
  controller.dispose()
})
test('lost begin response retains operation id; explicit refusal clears it before reset', async () => {
  const saved = storage(),
    methods = []
  const connection = {
    rpc: {
      call: async (_base, method, payload) => {
        methods.push({ method, payload })
        if (method.endsWith('begin')) throw new Error('disconnected')
        return {
          ok: true,
          value: method.endsWith('status')
            ? { status: 'idle', profileKey }
            : { status: 'unknown', profileKey, requestId: payload.requestId },
        }
      },
    },
  }
  const old = new UpdateController(
    connection,
    async () => () => {},
    () => DEFAULT_SETTINGS,
    saved,
  )
  old.publish({ status: 'available', candidate, profileKey })
  await old.begin()
  old.dispose()
  const next = new UpdateController(
    connection,
    async () => () => {},
    () => DEFAULT_SETTINGS,
    saved,
  )
  await next.load()
  assert.equal(methods.at(-1).method, 'dsh-glassui/update-reconcile')
  assert.equal(methods.filter(call => call.method.endsWith('begin')).length, 1)
  next.dispose()
})
test('connection reset during settlement or root disposal cannot admit a stale operation', async () => {
  let finish,
    sent = 0,
    released = 0
  const gate = new Promise(resolve => {
    finish = resolve
  })
  const controller = new UpdateController(
    {
      rpc: {
        call: async () => {
          sent++
          return { ok: true, value: { status: 'idle' } }
        },
      },
    },
    async () => {
      await gate
      return () => {
        released++
      }
    },
    () => DEFAULT_SETTINGS,
    storage(),
  )
  controller.publish({ status: 'available', candidate, profileKey })
  const preparing = controller.begin()
  controller.dispose()
  finish()
  await preparing
  assert.equal(sent, 0)
  assert.equal(released, 1)
})

test('same origin profile switch never reconciles another profile and retains original lost receipt', async () => {
  const saved = storage(),
    calls = []
  let current = profileKey
  const other = 'b'.repeat(64)
  const connection = {
    rpc: {
      call: async (_base, method, payload) => {
        calls.push({ method, payload })
        if (method.endsWith('begin')) throw new Error('lost response')
        return {
          ok: true,
          value: method.endsWith('status')
            ? { status: 'idle', profileKey: current }
            : { status: 'unknown', profileKey: current, requestId: payload.requestId },
        }
      },
    },
  }
  const controller = new UpdateController(
    connection,
    async () => () => {},
    () => DEFAULT_SETTINGS,
    saved,
  )
  controller.publish({ status: 'available', candidate, profileKey })
  await controller.begin()
  const original = controller.requestId
  current = other
  await controller.load()
  assert.equal(controller.state.status, 'idle')
  assert.equal(controller.requestId, undefined)
  assert.equal(calls.filter(call => call.method.endsWith('reconcile')).length, 0)
  current = profileKey
  await controller.load()
  assert.equal(calls.at(-1).payload.requestId, original)
  assert.equal(calls.at(-1).payload.profileKey, profileKey)
  assert.equal(controller.state.status, 'unknown')
  controller.dispose()
})

test('late begin response from previous profile cannot overwrite current receipt', async () => {
  let finish
  const saved = storage(),
    other = 'b'.repeat(64)
  const controller = new UpdateController(
    {
      rpc: {
        call: async (_base, method, payload) => {
          if (method.endsWith('begin'))
            return new Promise(resolve => {
              finish = () =>
                resolve({ ok: true, value: { status: 'installing', profileKey, requestId: payload.requestId } })
            })
          return { ok: true, value: { status: 'idle', profileKey: other } }
        },
      },
    },
    async () => () => {},
    () => DEFAULT_SETTINGS,
    saved,
  )
  controller.publish({ status: 'available', candidate, profileKey })
  const begin = controller.begin()
  await new Promise(resolve => setImmediate(resolve))
  await controller.load()
  finish()
  await begin
  assert.equal(controller.profileKey, other)
  assert.equal(controller.requestId, undefined)
  assert.equal(controller.state.status, 'idle')
  assert.equal(saved.getItem('dsh-glassui:update:' + other), undefined)
  controller.dispose()
})

test('authoritative active server operation replaces old browser receipt', async () => {
  const saved = storage(),
    calls = [],
    old = crypto.randomUUID(),
    current = crypto.randomUUID()
  saved.setItem('dsh-glassui:update:' + profileKey, old)
  const controller = new UpdateController(
    {
      rpc: {
        call: async (_base, method, payload) => {
          calls.push({ method, payload })
          return {
            ok: true,
            value: {
              status: 'installing',
              profileKey,
              requestId: method.endsWith('status') ? current : payload.requestId,
            },
          }
        },
      },
    },
    async () => () => {},
    () => DEFAULT_SETTINGS,
    saved,
  )
  await controller.load()
  assert.equal(controller.requestId, current)
  assert.equal(calls.at(-1).payload.requestId, current)
  assert.equal(controller.state.status, 'installing')
  assert.equal(saved.getItem('dsh-glassui:update:' + profileKey), current)
  assert.equal(
    calls.some(call => call.method.endsWith('begin')),
    false,
  )
  controller.dispose()
})
test('restore sends only an offered previous version and keeps a refusal unsuccessful', async () => {
  const saved = storage()
  const calls = []
  const controller = new UpdateController(
    {
      rpc: {
        call: async (_base, method, payload) => {
          calls.push({ method, payload })
          if (method.endsWith('restore'))
            return {
              ok: true,
              value: { status: 'failed', reason: 'restored', requestId: payload.requestId, profileKey },
            }
          return { ok: true, value: { status: 'unknown', reason: 'restore-offer', profileKey } }
        },
      },
    },
    async () => () => {},
    () => DEFAULT_SETTINGS,
    saved,
  )
  controller.publish({ status: 'unknown', reason: 'reinstall', profileKey })
  await controller.restore()
  assert.equal(calls.length, 0)
  controller.publish({ status: 'unknown', reason: 'restore-offer', profileKey, requestId: 'req' })
  controller.requestId = 'req'
  await controller.restore()
  assert.equal(calls.length, 1)
  assert.match(calls[0].method, /update-restore$/)
  assert.equal(calls[0].payload.requestId, 'req')
  assert.equal(calls[0].payload.profileKey, profileKey)
  assert.equal(controller.state.reason, 'restored')
  controller.publish({ status: 'unknown', reason: 'restore-limit', profileKey, requestId: 'req' })
  await controller.restore()
  assert.equal(calls.length, 2)
  assert.match(calls[1].method, /update-restore$/)
  assert.equal(calls[1].payload.requestId, 'req')
  controller.dispose()
  const refused = new UpdateController(
    {
      rpc: {
        call: async () => {
          throw new Error('dsh-glassui/network')
        },
      },
    },
    async () => () => {},
    () => DEFAULT_SETTINGS,
    storage(),
  )
  refused.publish({ status: 'unknown', reason: 'restore-offer', profileKey })
  refused.requestId = 'req'
  await refused.restore()
  assert.equal(refused.state.status, 'unknown')
  assert.equal(refused.state.reason, 'network')
  assert.notEqual(refused.state.reason, 'restored')
  refused.dispose()
})
