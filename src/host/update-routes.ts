import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { normalizeSettings, sameSettings, DEFAULT_SETTINGS, type GlassSettings } from '../shared/settings.ts'
import { ADMITTED_UPDATE_ERRORS, PluginUpdates, type Manager } from './updates.mjs'

interface Services {
  pluginManager: Manager
  profileContext: { dir: string; installAnchor: string }
}
interface Connection {
  fetch: {
    register(route: {
      path: string
      methods: string[]
      requestBody: 'buffered'
      fetch(request: Request): Promise<Response>
    }): void
  }
}
export interface UpdateHost {
  get?<K extends keyof Services>(name: K): Services[K] | undefined
  inject?(services: readonly string[], setup: (child: { connection: Connection }) => void): void
  effect?(setup: () => () => void, label?: string): void
}
function payloadOf(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-request')
  return value as Record<string, unknown>
}
function settingsOf(value: unknown): GlassSettings {
  const data = payloadOf(value)
  for (const [key, initial] of Object.entries(DEFAULT_SETTINGS)) {
    if (typeof data[key] !== typeof initial) throw new Error('invalid-request')
  }
  const settings = normalizeSettings(data)
  if (Object.entries(settings).some(([key, value]) => value !== data[key])) throw new Error('invalid-request')
  return settings
}
/** Optional authenticated routes. The boot material never requires these services. */
export function applyUpdateRoutes(ctx: UpdateHost, readSettings: () => GlassSettings, version: string): void {
  let expected: GlassSettings | undefined
  const updates = new PluginUpdates({
    manager: () => ctx.get?.('pluginManager'),
    profileDir: ctx.get?.('profileContext')?.dir,
    version,
    runtimeVersion: async () => {
      const anchor = ctx.get?.('profileContext')?.installAnchor
      if (!anchor) throw new Error('manager-unavailable')
      const path = createRequire(anchor).resolve('@deepseek-ai/dsh-app-boot')
      const module = (await import(pathToFileURL(path).href)) as { getDshRuntimeVersion(): string }
      return module.getDshRuntimeVersion()
    },
    isBusy: () => expected !== undefined && !sameSettings(readSettings(), expected),
  })
  ctx.effect?.(() => () => updates.dispose(), 'dsh-glassui: update retrieval')
  ctx.inject?.(['connection'], child => {
    for (const method of ['status', 'check', 'begin', 'reconcile', 'restore']) {
      const endpoint = `dsh-glassui/update-${method}`
      child.connection.fetch.register({
        path: `/api/${endpoint}`,
        methods: ['POST'],
        requestBody: 'buffered',
        async fetch(request) {
          let rpcId: string | undefined
          try {
            if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
              return new Response('unsupported media type', { status: 415 })
            const envelope = payloadOf(await request.json())
            if (
              envelope.type !== 'client-request' ||
              typeof envelope.rpcId !== 'string' ||
              envelope.rpcId.length > 100 ||
              envelope.method !== endpoint
            )
              return new Response('invalid request', { status: 400 })
            rpcId = envelope.rpcId
            request.signal.throwIfAborted()
            const payload = payloadOf(envelope.payload)
            let value
            if (method === 'status') value = await updates.status()
            else if (method === 'check') value = await updates.check()
            else if (method === 'reconcile') value = await updates.reconcile(payload.requestId)
            else if (method === 'restore') value = await updates.restore(payload.requestId, payload.profileKey)
            else {
              const settings = settingsOf(payload.settings)
              if (!sameSettings(readSettings(), settings)) throw new Error('settings')
              if (!updates.running) expected = settings
              value = await updates.begin(payload.candidateId, payload.requestId, payload.profileKey)
            }
            return Response.json(
              { type: 'server-response', rpcId, result: { ok: true, value } },
              { headers: { 'cache-control': 'no-store' } },
            )
          } catch (error) {
            if (rpcId === undefined) return new Response('invalid request', { status: 400 })
            const code =
              error instanceof Error && ADMITTED_UPDATE_ERRORS.includes(error.message) ? error.message : 'update-failed'
            return Response.json(
              {
                type: 'server-response',
                rpcId,
                result: { ok: false, error: { code: `dsh-glassui/${code}`, message: code, details: {} } },
              },
              { headers: { 'cache-control': 'no-store' } },
            )
          }
        },
      })
    }
  })
}
