import assert from 'node:assert/strict'
import { test } from 'node:test'
import { UpdateController } from '../../src/client/update-controller.mjs'
import { DEFAULT_SETTINGS } from '../../src/shared/settings.ts'
function storage() {
  const map = new Map()
  return {
    getItem: key => map.get(key),
    setItem: (key, value) => map.set(key, value),
    removeItem: key => map.delete(key),
  }
}
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
          return { ok: true, value: { status: 'restart-required' } }
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
  controller.publish({ status: 'available', candidate })
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
  rejected.publish({ status: 'available', candidate })
  await rejected.begin()
  assert.equal(rejected.state.status, 'failed')
  assert.equal(rejected.state.reason, 'settings')
  rejected.dispose()
})
test('lost begin response retains operation id; explicit refusal clears it before reset', async () => {
  const saved = storage(),
    methods = []
  const connection = {
    rpc: {
      call: async (_base, method, payload) => {
        methods.push({ method, payload })
        if (method.endsWith('begin')) throw new Error('disconnected')
        return { ok: true, value: { status: 'unknown', requestId: payload.requestId } }
      },
    },
  }
  const old = new UpdateController(
    connection,
    async () => () => {},
    () => DEFAULT_SETTINGS,
    saved,
  )
  old.publish({ status: 'available', candidate })
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
  controller.publish({ status: 'available', candidate })
  const preparing = controller.begin()
  controller.dispose()
  finish()
  await preparing
  assert.equal(sent, 0)
  assert.equal(released, 1)
})
