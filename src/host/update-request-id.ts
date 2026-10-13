import { randomUUID } from 'node:crypto'
import type { PluginInstallRequestId } from '@deepseek-ai/dsh-plugin-manager/types'
/** Each server-created UUID owns exactly one manager installation. */
export function updateRequestId(value = randomUUID()): PluginInstallRequestId {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value)) throw new Error('invalid-request')
  return value as PluginInstallRequestId
}
