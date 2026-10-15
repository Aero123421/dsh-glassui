import type { BundleInfo, ChangeResult, InstallBundleOptions } from '@deepseek-ai/dsh-plugin-manager/types'
export interface Manager {
  listBundles(): Promise<BundleInfo[]>
  installBundle(spec: string, options: InstallBundleOptions): Promise<ChangeResult>
  /** Present when the host can remove a bundle. Required to recover from `already-installed`. */
  removeBundle?(name: string): Promise<ChangeResult>
  waitForInstall(id: NonNullable<InstallBundleOptions['requestId']>): Promise<ChangeResult | null>
}
export type Status =
  | 'idle'
  | 'checking'
  | 'current'
  | 'available'
  | 'blocked'
  | 'settling'
  | 'starting'
  | 'preparing'
  | 'installing'
  | 'restart-required'
  | 'applied'
  | 'failed'
  | 'cancelled'
  | 'overridden'
  | 'unknown'
export interface Candidate {
  id: string
  version: string
  url: string
  notes: string
  compatibility: string
  tag: string
  filename: string
  tarball: string
  checksum: string
}
export interface View {
  status: Status
  profileKey?: string
  runtimeVersion?: string
  installedVersion?: string
  version?: string
  reason?: string
  requestId?: string
  checkedAt?: string
  candidate?: Pick<Candidate, 'id' | 'version' | 'url' | 'notes' | 'compatibility'> | null
  result?: Pick<ChangeResult, 'changed' | 'application' | 'stage' | 'bundle' | 'version' | 'enabled' | 'error'>
}
export class PluginUpdates {
  constructor(options: {
    manager: () => Manager | undefined
    profileDir?: string | undefined
    runtimeVersion: () => Promise<string>
    isBusy?: () => boolean
    fetcher?: typeof fetch
    version: string
  })
  running: View | null
  status(): Promise<View>
  check(): Promise<View>
  begin(id: unknown, operationId: unknown, profileKey: unknown): Promise<View>
  reconcile(requestId: unknown): Promise<View>
  dispose(): void
}
export const REPOSITORY: string
export const PACKAGE: string
export const RELEASES: string
export function semanticVersion(value: unknown): { numbers: bigint[]; pre?: string[] }
export function compareVersions(left: string, right: string): number
export function boundedFetch(
  url: string,
  limit: number,
  options?: { fetcher?: typeof fetch; signal?: AbortSignal },
): Promise<Buffer>
export function sourceKind(source: unknown, cacheDir?: string, installedVersion?: string): 'github' | 'tarball'
export function releaseCandidate(release: unknown, current: string): Candidate | null
export function checkCompatibility(packageJson: unknown, candidate: Pick<Candidate, 'version'>, runtime: string): string
export function peerRangeDecision(range: unknown, runtime: string): 'ok' | 'unknown' | 'incompatible'
export function packageManifest(bytes: Buffer): unknown
export function resultState(
  result: ChangeResult | null,
  expected: string,
  runtime: string,
  installed?: BundleInfo,
): Status
export type RestoreState = 'ok' | 'failed' | 'pending' | 'cancelled' | 'cancelled-absent' | 'unconfirmed'
export function installRelease(
  manager: Manager,
  spec: string,
  options: InstallBundleOptions,
  previous?: { source?: string; enabled?: boolean; version?: string },
  hooks?: {
    onRestoreRequest?: (requestId: string, previousVersion?: string) => void | Promise<void>
  },
): Promise<{ result: ChangeResult; removed: boolean; restore?: RestoreState; restoreRequestId?: string }>
export function settleRemoval(
  operation: {
    status?: string
    reason?: string
    restore?: RestoreState
    reinstall?: boolean
    version?: string
  },
  runtimeVersion?: string,
): void
