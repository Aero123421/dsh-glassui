import type { GlassSettings } from '../shared/settings.ts'
import type { View } from '../host/updates.mjs'
export interface UpdateConnection {
  rpc: {
    call(
      base: string,
      method: string,
      payload: object,
    ): Promise<{ ok: true; value: View } | { ok: false; error: { code: string } }>
  }
}
export class UpdateController {
  constructor(
    connection: UpdateConnection | undefined,
    settleSettings: () => Promise<() => void>,
    settings: () => GlassSettings,
    storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  )
  attach(connection: UpdateConnection): () => void
  getSnapshot: () => View
  subscribe: (listener: () => void) => () => void
  load(): Promise<void>
  check(): Promise<void>
  begin(): Promise<void>
  dispose(): void
}
