import { createHash, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, writeFile, readFile, rename, lstat } from 'node:fs/promises'
import { join, resolve, sep, basename, win32 } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { updateRequestId } from './update-request-id.ts'
import semver from 'semver'

export const REPOSITORY = 'Aero123421/dsh-glassui'
export const PACKAGE = 'dsh-glassui'
export const RELEASES = `https://github.com/${REPOSITORY}/releases`
const ROOT = `https://api.github.com/repos/${REPOSITORY}`
const MAX_PACKAGE = 32 * 1024 * 1024
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/

function reasonOf(error) {
  const allowed = [
    'manager-unavailable',
    'read-only',
    'source',
    'metadata',
    'asset',
    'channel',
    'incompatible',
    'compatibility-unknown',
    'busy',
    'checksum',
    'redirect',
    'size',
    'stale-candidate',
    'release-unavailable',
    'storage',
    'interrupted',
  ]
  return allowed.includes(error?.message) ? error.message : 'network'
}

export function semanticVersion(value) {
  if (typeof value !== 'string') throw new Error('metadata')
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(
      value,
    )
  if (!match || match[4]?.split('.').some(part => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0')))
    throw new Error('metadata')
  return { numbers: match.slice(1, 4).map(BigInt), pre: match[4]?.split('.') }
}
export function compareVersions(left, right) {
  const a = semanticVersion(left),
    b = semanticVersion(right)
  for (let i = 0; i < 3; i++) if (a.numbers[i] !== b.numbers[i]) return a.numbers[i] > b.numbers[i] ? 1 : -1
  if (!a.pre || !b.pre) return a.pre ? -1 : b.pre ? 1 : 0
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    const x = a.pre[i],
      y = b.pre[i]
    if (x === y) continue
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1
    const nx = /^\d+$/.test(x),
      ny = /^\d+$/.test(y)
    if (nx && ny) return BigInt(x) > BigInt(y) ? 1 : -1
    if (nx !== ny) return nx ? -1 : 1
    return x > y ? 1 : -1
  }
  return 0
}

function allowedUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) throw new Error('redirect')
  if (url.hostname === 'api.github.com' && url.pathname.startsWith(`/repos/${REPOSITORY}/`)) return url
  if (url.hostname === 'github.com' && url.pathname.startsWith(`/${REPOSITORY}/releases/download/`)) return url
  if (url.hostname === 'raw.githubusercontent.com' && url.pathname.startsWith(`/${REPOSITORY}/`)) return url
  if (['release-assets.githubusercontent.com', 'objects.githubusercontent.com'].includes(url.hostname)) return url
  throw new Error('redirect')
}
export async function boundedFetch(url, limit, { fetcher = fetch, signal } = {}) {
  const timeout = AbortSignal.timeout(20000)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  for (let redirects = 0; redirects <= 4; redirects++) {
    const response = await fetcher(allowedUrl(url), {
      redirect: 'manual',
      signal: combined,
      headers: { accept: 'application/vnd.github+json' },
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get('location')
      await response.body?.cancel()
      if (!next) throw new Error('redirect')
      url = new URL(next, url).href
      continue
    }
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(response.status === 404 ? 'release-unavailable' : 'network')
    }
    if (Number(response.headers.get('content-length')) > limit) {
      await response.body?.cancel()
      throw new Error('size')
    }
    const chunks = []
    let bytes = 0
    const reader = response.body?.getReader()
    if (!reader) throw new Error('network')
    try {
      for (;;) {
        combined.throwIfAborted()
        const { done, value } = await reader.read()
        if (done) return Buffer.concat(chunks, bytes)
        bytes += value.byteLength
        if (bytes > limit) throw new Error('size')
        chunks.push(Buffer.from(value))
      }
    } finally {
      await reader.cancel().catch(() => {})
      reader.releaseLock()
    }
  }
  throw new Error('redirect')
}

export function sourceKind(source, cacheDir, installedVersion) {
  if (typeof source !== 'string') throw new Error('source')
  if (/^github:Aero123421\/dsh-glassui(?:#[A-Za-z0-9._/-]+)?$/.test(source)) return 'github'
  if (/^(?:git\+)?https:\/\/github\.com\/Aero123421\/dsh-glassui(?:\.git)?(?:#[A-Za-z0-9._/-]+)?$/.test(source))
    return 'github'
  if (
    /^https:\/\/github\.com\/Aero123421\/dsh-glassui\/releases\/download\/v[^/]+\/dsh-glassui-[^/]+\.tgz$/.test(source)
  )
    return 'tarball'
  if (cacheDir && source.startsWith('file:') && resolve(source.slice(5)).startsWith(resolve(cacheDir) + sep))
    return 'tarball'
  if (installedVersion && source.startsWith('file:')) {
    semanticVersion(installedVersion)
    const file = source.slice(5)
    if ([basename(file), win32.basename(file)].includes(`dsh-glassui-${installedVersion}.tgz`)) return 'tarball'
  }
  // Arbitrary local files and registry packages have no verified update provenance.
  throw new Error('source')
}
export function releaseCandidate(release, current) {
  if (
    !release ||
    !Number.isSafeInteger(release.id) ||
    release.id <= 0 ||
    release.draft !== false ||
    release.prerelease !== false ||
    typeof release.tag_name !== 'string' ||
    !release.tag_name.startsWith('v')
  )
    throw new Error('metadata')
  const version = release.tag_name.slice(1)
  if (semanticVersion(version).pre) throw new Error('channel')
  const expectedLink = `${RELEASES}/tag/${release.tag_name}`
  if (release.html_url !== expectedLink || typeof release.body !== 'string' || !Array.isArray(release.assets))
    throw new Error('metadata')
  const filename = `dsh-glassui-${version}.tgz`
  function asset(name) {
    const matches = release.assets.filter(asset => asset?.name === name)
    if (matches.length !== 1) throw new Error('asset')
    const item = matches[0]
    if (
      !Number.isSafeInteger(item.id) ||
      item.id <= 0 ||
      !Number.isSafeInteger(item.size) ||
      item.size <= 0 ||
      item.browser_download_url !== `https://github.com/${REPOSITORY}/releases/download/${release.tag_name}/${name}`
    )
      throw new Error('asset')
    return item.browser_download_url
  }
  const candidate = {
    id: String(release.id),
    version,
    tag: release.tag_name,
    url: expectedLink,
    notes: release.body.slice(0, 6000),
    filename,
    tarball: asset(filename),
    checksum: asset('SHA256SUMS'),
  }
  return compareVersions(version, current) > 0 ? candidate : null
}
export function checkCompatibility(packageJson, candidate, runtime) {
  semanticVersion(runtime)
  if (
    !packageJson ||
    packageJson.name !== PACKAGE ||
    packageJson.version !== candidate.version ||
    typeof packageJson.dsh?.bundle?.patch !== 'string'
  )
    throw new Error('metadata')
  const peers = Object.entries(packageJson.peerDependencies ?? {}).filter(
    ([name]) => name === '@deepseek-ai/dsh' || name.startsWith('@deepseek-ai/dsh-'),
  )
  if (!peers.length || peers.some(([, range]) => typeof range !== 'string')) throw new Error('compatibility-unknown')
  for (const [, range] of peers) {
    const decision = peerRangeDecision(range, runtime)
    if (decision === 'unknown') throw new Error('compatibility-unknown')
    if (decision === 'incompatible') throw new Error('incompatible')
  }
  return runtime
}
/**
 * Whether `range` may be used as a DSH peer of the running release.
 * Empty text and wildcards are `unknown`. A range that does not admit
 * `runtime` is `incompatible`. A range that admits `runtime` is still
 * `unknown` unless every alternative has both a lower and an upper bound and
 * the whole range stays inside the running line: nothing older than that
 * line's floor matches, and nothing from the next line upward matches.
 * On 0.2 the floor is this plugin's supported `0.2.0-rc.2` and the next line
 * starts at `0.3.0-0`, so `<0.3.0-0`, `<=0.2.9`, `<0.2.2`, and
 * `>=0.0.0 <0.3.0-0` are unknown, while `>=0.2.0-rc.2 <0.3.0-0` is ok.
 * Other 0.x lines run from `0.<minor>.0-0` to `0.<minor+1>.0-0`. On 1.x and
 * later the line runs from `<major>.0.0-0` to `<major+1>.0.0-0`.
 * @param {unknown} range
 * @param {string} runtime
 * @returns {'ok' | 'unknown' | 'incompatible'}
 */
export function peerRangeDecision(range, runtime) {
  const current = semver.parse(runtime, { includePrerelease: true })
  if (!current || typeof range !== 'string' || range.trim() === '') return 'unknown'
  const text = range.trim()
  if (!semver.validRange(text)) return 'unknown'
  if (!semver.satisfies(runtime, text, { includePrerelease: true })) return 'incompatible'
  return peerRangeInCurrentSeries(text, current) ? 'ok' : 'unknown'
}
/** Oldest release of this plugin's 0.2 line. A lower bound below it leaves the line. */
const DSH_02_FLOOR = '0.2.0-rc.2'

/** @param {import('semver').SemVer} current */
function seriesFloor(current) {
  if (current.major === 0 && current.minor === 2) return DSH_02_FLOOR
  if (current.major === 0) return `${current.major}.${current.minor}.0-0`
  return `${current.major}.0.0-0`
}
/** @param {import('semver').SemVer} current */
function seriesNext(current) {
  return current.major === 0 ? `${current.major}.${current.minor + 1}.0-0` : `${current.major + 1}.0.0-0`
}
/**
 * An exact version is both ends. Anything else needs `>` / `>=` or `<` / `<=`.
 * @param {import('semver').Comparator} item
 * @param {'lower' | 'upper'} direction
 */
function boundedComparator(item, direction) {
  const exact = (item.operator === '' || item.operator === '=') && typeof item.semver?.version === 'string'
  if (exact) return true
  if (direction === 'upper') return item.operator === '<' || item.operator === '<='
  return item.operator === '>' || item.operator === '>='
}
/**
 * Same rule as dsh-pi-login `peerRangeInCurrentSeries`: every OR branch has a
 * lower and an upper comparator, nothing older than the series floor matches,
 * and nothing from the next series upward matches. `<99` and `^0` have a
 * written cap and still reach outside this floor.
 * @param {string} range
 * @param {import('semver').SemVer} current
 */
function peerRangeInCurrentSeries(range, current) {
  let parsed
  try {
    parsed = new semver.Range(range, { includePrerelease: true })
  } catch {
    return false
  }
  if (parsed.set.length === 0) return false
  const shaped = parsed.set.every(
    comparators =>
      comparators.some(item => boundedComparator(item, 'lower')) &&
      comparators.some(item => boundedComparator(item, 'upper')),
  )
  if (!shaped) return false
  const options = { includePrerelease: true }
  try {
    if (semver.intersects(range, `<${seriesFloor(current)}`, options)) return false
    if (semver.intersects(range, `>=${seriesNext(current)}`, options)) return false
  } catch {
    return false
  }
  return true
}
export function packageManifest(bytes) {
  const tar = gunzipSync(bytes, { maxOutputLength: 128 * 1024 * 1024 })
  let manifest
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512)
    if (header.every(byte => byte === 0)) break
    const name = header.subarray(0, 100).toString().replace(/\0.*$/, '')
    const prefix = header.subarray(345, 500).toString().replace(/\0.*$/, '')
    const sizeText = header.subarray(124, 136).toString().replace(/\0.*$/, '').trim()
    if (!/^[0-7]+$/.test(sizeText)) throw new Error('metadata')
    const size = Number.parseInt(sizeText, 8)
    if (!Number.isSafeInteger(size) || offset + 512 + size > tar.length) throw new Error('metadata')
    const path = prefix ? `${prefix}/${name}` : name
    if (path === 'package/package.json') {
      if (manifest || ![0, 48].includes(header[156]) || size > 65536) throw new Error('metadata')
      manifest = JSON.parse(tar.subarray(offset + 512, offset + 512 + size).toString())
    }
    offset += 512 + Math.ceil(size / 512) * 512
  }
  if (!manifest) throw new Error('metadata')
  return manifest
}
function safeResult(result) {
  if (!result) return null
  return {
    changed: result.changed,
    application: result.application,
    stage: result.stage,
    target: PACKAGE,
    bundle: result.bundle,
    version: result.version,
    enabled: result.enabled,
    ...(result.error ? { error: { code: result.error.code } } : {}),
    ...(result.packageResult
      ? {
          packageResult: {
            exitCode: result.packageResult.exitCode,
            timedOut: result.packageResult.timedOut,
            kind: result.packageResult.kind,
          },
        }
      : {}),
  }
}

export function resultState(result, expected, runtime, installed) {
  if (!result) return 'unknown'
  if (['cancelled', 'overridden'].includes(result.application)) return result.application
  if (
    result.error ||
    result.application === 'failed' ||
    (result.packageResult && (result.packageResult.exitCode !== 0 || result.packageResult.timedOut))
  )
    return 'failed'
  if (
    result.bundle !== PACKAGE ||
    result.version !== expected ||
    !installed?.installed ||
    installed.version !== expected ||
    installed.error ||
    installed.readOnlyReason
  )
    return 'unknown'
  if (result.application === 'restart-required') return 'restart-required'
  return result.application === 'applied' && runtime === expected ? 'applied' : 'unknown'
}

// Keeps the remove-then-install chain alive if HMR disposes this plugin mid-removal.
const retainedInstalls = new Set()
function retainInstall(promise) {
  retainedInstalls.add(promise)
  const release = () => {
    retainedInstalls.delete(promise)
  }
  // Swallow the derived promise so a rejected install is handled by its awaiter only.
  void promise.then(release, release)
  return promise
}
function removalAccepted(result) {
  return Boolean(
    result && !result.error && (result.application === 'applied' || result.application === 'restart-required'),
  )
}

function failedInstall(code = 'operation-error') {
  return {
    changed: false,
    application: 'failed',
    stage: 'install',
    target: PACKAGE,
    error: { code },
  }
}

/** Reads of the bundle list. A later success still counts; a persistent failure does not. */
export const BUNDLE_LIST_ATTEMPTS = 3

/**
 * @param {Manager} manager
 * @returns {Promise<{ known: boolean, row: object | null }>}
 */
async function installedCopy(manager) {
  let failed = 0
  while (failed < BUNDLE_LIST_ATTEMPTS) {
    try {
      const row = (await manager.listBundles()).find(item => item?.name === PACKAGE && item.installed)
      return { known: true, row: row ?? null }
    } catch {
      failed += 1
    }
  }
  return { known: false, row: null }
}
/**
 * The previous package is back only when its version is the one installed now.
 * A list failure is not that confirmation.
 * @param {{ version?: string } | undefined} previous
 * @param {object | null} row
 */
function versionRestored(previous, row) {
  return (
    typeof previous?.version === 'string' &&
    previous.version !== '' &&
    row?.installed === true &&
    row.version === previous.version &&
    !row.error &&
    !row.readOnlyReason
  )
}
/**
 * @param {ChangeResult | null | undefined} restored
 * @param {{ version?: string } | undefined} previous
 * @param {{ known: boolean, row: object | null }} listed
 * @returns {RestoreState}
 */
function classifyRestore(restored, previous, listed) {
  if (restored?.application === 'cancelled') return listed.known && !listed.row ? 'cancelled-absent' : 'cancelled'
  if (!listed.known) return 'unconfirmed'
  const back = versionRestored(previous, listed.row)
  if (restored?.application === 'restart-required') return back ? 'pending' : 'failed'
  return back ? 'ok' : 'failed'
}
/**
 * Install the spec captured before removal. The request id is published before
 * `installBundle` so a restart can reconcile that id if this process stops.
 * @param {Manager} manager
 * @param {{ source?: string, enabled?: boolean, version?: string } | undefined} previous
 * @param {RestoreHooks | undefined} hooks
 * @returns {Promise<{ state: RestoreState, requestId: string } | undefined>}
 */
async function reinstallPrevious(manager, previous, hooks) {
  const source = previous?.source
  if (typeof source !== 'string' || source === '') return undefined
  const requestId = updateRequestId()
  if (hooks?.onRestoreRequest) await hooks.onRestoreRequest(requestId, previous.version)
  let restored
  try {
    restored = await manager.installBundle(source, {
      enabled: previous.enabled === true,
      requestId,
    })
  } catch {
    restored = failedInstall()
  }
  const listed = await installedCopy(manager)
  return { state: classifyRestore(restored, previous, listed), requestId }
}
/**
 * Put the previous spec back when the package is confirmed absent.
 * `failed`, `cancelled`, and `overridden` all restore in that case.
 * `already-installed` does not: the package is still the one that was there.
 * @param {Manager} manager
 * @param {ChangeResult | null | undefined} installed
 * @param {{ source?: string, enabled?: boolean, version?: string } | undefined} previous
 * @param {RestoreHooks | undefined} hooks
 * @returns {Promise<{ state: RestoreState, requestId: string } | undefined>}
 */
async function restoreIfMissing(manager, installed, previous, hooks) {
  const source = previous?.source
  if (typeof source !== 'string' || source === '') return undefined
  if (installed?.error?.code === 'already-installed') return undefined
  const outcome = installed?.application
  if (outcome !== 'failed' && outcome !== 'cancelled' && outcome !== 'overridden') return undefined
  const listed = await installedCopy(manager)
  // Absence is not confirmed, or the package is still installed. Do not install another copy.
  if (!listed.known || listed.row) return undefined
  return reinstallPrevious(manager, previous, hooks)
}

/**
 * Record a removal that the new install did not replace.
 * `ok` becomes `failed` / `restored` only after the previous version is confirmed.
 * `pending` stays `restart-required`. `cancelled` stays `cancelled`.
 * `unconfirmed` and a failed install with `reinstall` stay `unknown`.
 * When `runtimeVersion` is already the candidate, a pending restore does not
 * replace a promotion to `applied`.
 * @param {object} operation
 * @param {string} [runtimeVersion]
 */
export function settleRemoval(operation, runtimeVersion) {
  if (operation.restore === 'ok') {
    operation.status = 'failed'
    operation.reason = 'restored'
    return
  }
  if (operation.restore === 'pending') {
    if (runtimeVersion && runtimeVersion === operation.version) {
      if (operation.reason === 'restore-pending') delete operation.reason
      return
    }
    operation.status = 'restart-required'
    operation.reason = 'restore-pending'
    return
  }
  if (operation.restore === 'cancelled' || operation.restore === 'cancelled-absent') {
    operation.status = 'cancelled'
    if (operation.restore === 'cancelled-absent') operation.reason = 'restore-failed'
    else delete operation.reason
    return
  }
  if (operation.restore === 'failed') {
    operation.status = 'failed'
    operation.reason = 'restore-failed'
    return
  }
  if (operation.restore === 'unconfirmed' || (operation.reinstall && operation.status === 'failed')) {
    operation.status = 'unknown'
    operation.reason = 'reinstall'
  }
}

/**
 * Install one verified release.
 * With HMR, DSH 0.2.1-alpha.3 returns `already-installed` from `installBundle`
 * before pnpm when the spec names an installed package, and changes no profile
 * file. The Plugins page (`ui-plugin-manager`, not the package being updated)
 * calls `removeBundle`, then `installBundle`. This bundle is that package, so
 * removal stops it before `removeBundle` resolves. The follow-up install is
 * therefore chained on the manager object the caller captured, not on a second
 * lookup after disposal. Without HMR, removal of a running bundle returns
 * `stop-profile` and leaves it installed; installing over it reports
 * `restart-required`, including on 0.2.1-alpha.2. A throw from that overwrite
 * install is a failed install; the package was not removed. Any other removal
 * failure is followed by an install of the new spec only when this package is
 * still present. If `removeBundle` throws, or it reports failure while
 * `listBundles` shows the package gone, the previous spec is installed again.
 * The same restore runs when the new install returns `failed`, `cancelled`, or
 * `overridden` and the package is absent. The restore request id is the one
 * `hooks.onRestoreRequest` observed before that `installBundle`.
 * @param {Manager} manager
 * @param {string} spec
 * @param {import('@deepseek-ai/dsh-plugin-manager/types').InstallBundleOptions} options
 * @param {{ source?: string, enabled?: boolean, version?: string } | undefined} [previous]
 * @param {{ onRestoreRequest?: (requestId: string, previousVersion?: string) => Promise<void> | void } | undefined} [hooks]
 */
export async function installRelease(manager, spec, options, previous, hooks) {
  const installed = await manager.installBundle(spec, options)
  if (installed?.error?.code !== 'already-installed' || typeof manager.removeBundle !== 'function') {
    return { result: installed, removed: false }
  }
  let removed
  try {
    removed = await manager.removeBundle(PACKAGE)
  } catch {
    removed = failedInstall()
  }
  if (removed?.error?.code === 'stop-profile') {
    const listed = await installedCopy(manager)
    // `stop-profile` leaves the package installed. Restore only when a list proves it is gone.
    if (listed.known && !listed.row) return removalNeedsRestore(manager, removed, previous, hooks)
    try {
      return { result: await manager.installBundle(spec, options), removed: false }
    } catch {
      return { result: failedInstall(), removed: false }
    }
  }
  if (!removalAccepted(removed)) {
    const listed = await installedCopy(manager)
    if (!listed.known) return { result: removed ?? installed, removed: true, restore: 'unconfirmed' }
    if (!listed.row) return removalNeedsRestore(manager, removed ?? installed, previous, hooks)
    return { result: removed ?? installed, removed: false }
  }
  let result
  try {
    result = await manager.installBundle(spec, options)
  } catch {
    result = failedInstall()
  }
  const restore = await restoreIfMissing(manager, result, previous, hooks)
  return {
    result,
    removed: true,
    ...(restore ? { restore: restore.state, restoreRequestId: restore.requestId } : {}),
  }
}
/**
 * @param {Manager} manager
 * @param {ChangeResult} result
 * @param {{ source?: string, enabled?: boolean, version?: string } | undefined} previous
 * @param {{ onRestoreRequest?: (requestId: string, previousVersion?: string) => Promise<void> | void } | undefined} hooks
 */
async function removalNeedsRestore(manager, result, previous, hooks) {
  const restore = await reinstallPrevious(manager, previous, hooks)
  return {
    result,
    removed: true,
    ...(restore ? { restore: restore.state, restoreRequestId: restore.requestId } : {}),
  }
}

/** Optional manager is resolved for every operation; the glass material never depends on it. */
export class PluginUpdates {
  constructor({ manager, profileDir, runtimeVersion, isBusy = () => false, fetcher = fetch, version }) {
    Object.assign(this, { manager, profileDir, runtimeVersion, isBusy, fetcher, version })
    this.candidate = null
    this.checking = null
    this.running = null
    this.closed = false
    this.abort = new AbortController()
  }
  get cacheDir() {
    return this.profileDir && join(this.profileDir, '.dsh-glassui-updates')
  }
  async capability() {
    const manager = this.manager()
    if (
      !manager ||
      typeof manager.listBundles !== 'function' ||
      typeof manager.installBundle !== 'function' ||
      typeof manager.waitForInstall !== 'function' ||
      !this.profileDir
    )
      throw new Error('manager-unavailable')
    const bundle = (await manager.listBundles()).find(item => item.name === PACKAGE)
    if (!bundle?.installed || bundle.readOnlyReason || bundle.error) throw new Error('read-only')
    const source = sourceKind(bundle.source, this.cacheDir, bundle.version)
    if (bundle.source.startsWith('file:')) {
      try {
        if (!(await lstat(bundle.source.slice(5))).isFile()) throw new Error('source')
      } catch {
        throw new Error('source')
      }
    }
    const dshVersion = await this.runtimeVersion()
    semanticVersion(dshVersion)
    return { manager, bundle, source, dshVersion }
  }
  base() {
    return {
      runtimeVersion: this.version,
      releases: RELEASES,
      profileKey: this.profileDir
        ? createHash('sha256')
            .update(PACKAGE + '\0' + resolve(this.profileDir))
            .digest('hex')
        : undefined,
    }
  }
  async lastOperation() {
    try {
      const value = JSON.parse(await readFile(join(this.cacheDir, 'latest.json'), 'utf8'))
      return typeof value.requestId === 'string' && UUID.test(value.requestId) ? value.requestId : undefined
    } catch {
      return undefined
    }
  }
  async status() {
    try {
      const { dshVersion } = await this.capability()
      const requestId = this.running?.requestId ?? (await this.lastOperation())
      return requestId
        ? { ...(await this.reconcile(requestId)), dshVersion }
        : { ...this.base(), dshVersion, status: 'idle' }
    } catch (error) {
      return { ...this.base(), status: 'blocked', reason: reasonOf(error) }
    }
  }
  async privateDir() {
    await mkdir(this.cacheDir, { recursive: true, mode: 0o700 })
    if (!(await lstat(this.cacheDir)).isDirectory() || (await lstat(this.cacheDir)).isSymbolicLink())
      throw new Error('storage')
    return this.cacheDir
  }
  async getCandidate(current) {
    const options = { fetcher: this.fetcher, signal: this.abort.signal }
    const release = JSON.parse((await boundedFetch(`${ROOT}/releases/latest`, 256 * 1024, options)).toString())
    const candidate = releaseCandidate(release, current)
    if (!candidate) return null
    const packageJson = JSON.parse(
      (
        await boundedFetch(
          `https://raw.githubusercontent.com/${REPOSITORY}/${candidate.tag}/package.json`,
          64 * 1024,
          options,
        )
      ).toString(),
    )
    candidate.compatibility = checkCompatibility(packageJson, candidate, await this.runtimeVersion())
    return candidate
  }
  check() {
    if (this.checking) return this.checking
    this.checking = (async () => {
      try {
        if (this.closed || this.running) throw new Error('busy')
        const { bundle } = await this.capability()
        const last = await this.lastOperation()
        if (last && ['installing', 'unknown', 'restart-required'].includes((await this.reconcile(last)).status))
          throw new Error('busy')
        this.candidate = await this.getCandidate(bundle.version ?? this.version)
        return {
          ...this.base(),
          status: this.candidate ? 'available' : 'current',
          candidate: this.candidate && this.publicCandidate(this.candidate),
          checkedAt: new Date().toISOString(),
        }
      } catch (error) {
        this.candidate = null
        return { ...this.base(), status: 'blocked', reason: reasonOf(error) }
      }
    })().finally(() => {
      this.checking = null
    })
    return this.checking
  }
  publicCandidate(candidate) {
    const { id, version, url, notes, compatibility } = candidate
    return { id, version, url, notes, compatibility }
  }
  async begin(id, operationId, profileKey) {
    if (!profileKey || profileKey !== this.base().profileKey) throw new Error('profile')
    if (typeof operationId !== 'string') throw new Error('invalid-request')
    const requestId = updateRequestId(operationId)
    await this.capability()
    if (this.running?.requestId === requestId) return { ...this.base(), ...this.running }
    try {
      await readFile(join(this.cacheDir, `${requestId}.json`))
      return this.reconcile(requestId)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    const last = await this.lastOperation()
    if (last && ['installing', 'unknown', 'restart-required'].includes((await this.reconcile(last)).status))
      throw new Error('busy')
    if (this.closed || this.running || this.checking || this.isBusy()) throw new Error('busy')
    if (typeof id !== 'string' || !this.candidate || id !== this.candidate.id) throw new Error('stale-candidate')
    const candidate = this.candidate
    this.running = { requestId, version: candidate.version, status: 'preparing' }
    try {
      await this.privateDir()
      await this.save(this.running, true)
    } catch (error) {
      this.running = null
      throw error
    }
    // Do not await install in an RPC owned by the plugin being replaced.
    void this.execute(candidate, this.running).finally(() => {
      this.running = null
    })
    return { ...this.base(), ...this.running }
  }
  async save(operation, claim = false) {
    const directory = await this.privateDir(),
      file = join(directory, `${operation.requestId}.json`)
    const temp = join(directory, `${operation.requestId}.${randomUUID()}.tmp`)
    await writeFile(temp, JSON.stringify(operation), { flag: 'wx', mode: 0o600 })
    await rename(temp, file)
    if (!claim) return
    const index = join(directory, `${randomUUID()}.tmp`)
    await writeFile(index, JSON.stringify({ requestId: operation.requestId }), { flag: 'wx', mode: 0o600 })
    await rename(index, join(directory, 'latest.json'))
  }
  async execute(candidate, operation) {
    let managerInvoked = false
    try {
      const before = await this.capability()
      const fresh = await this.getCandidate(before.bundle.version ?? this.version)
      if (
        !fresh ||
        fresh.id !== candidate.id ||
        fresh.version !== candidate.version ||
        fresh.tarball !== candidate.tarball
      )
        throw new Error('stale-candidate')
      const options = { fetcher: this.fetcher, signal: this.abort.signal }
      const checksum = (await boundedFetch(candidate.checksum, 8192, options)).toString()
      const lines = checksum.trim().split(/\r?\n/)
      if (lines.length !== 1) throw new Error('checksum')
      const match = /^([a-fA-F0-9]{64}) {2}(\S+)$/.exec(lines[0])
      if (!match || match[2] !== candidate.filename) throw new Error('checksum')
      const bytes = await boundedFetch(candidate.tarball, MAX_PACKAGE, options)
      if (createHash('sha256').update(bytes).digest('hex') !== match[1].toLowerCase()) throw new Error('checksum')
      checkCompatibility(packageManifest(bytes), candidate, await this.runtimeVersion())
      const dir = await mkdtemp(join(await this.privateDir(), 'verified-'))
      const path = join(dir, candidate.filename)
      await writeFile(path, bytes, { flag: 'wx', mode: 0o600 })
      const latest = await this.capability()
      if (
        latest.bundle.source !== before.bundle.source ||
        latest.bundle.enabled !== before.bundle.enabled ||
        this.isBusy() ||
        this.closed
      )
        throw new Error('busy')
      const spec = latest.source === 'github' ? `github:${REPOSITORY}#${candidate.tag}` : path
      operation.status = 'installing'
      await this.save(operation)
      if (this.closed || this.isBusy()) throw new Error('busy')
      const final = await this.capability()
      if (this.closed || this.isBusy() || final.bundle.source !== before.bundle.source) throw new Error('busy')
      if (compareVersions(candidate.version, final.bundle.version) <= 0) throw new Error('stale-candidate')
      managerInvoked = true
      const manager = final.manager
      const previous = {
        source: final.bundle.source,
        enabled: final.bundle.enabled === true,
        version: typeof final.bundle.version === 'string' ? final.bundle.version : undefined,
      }
      operation.previousSource = previous.source
      operation.previousEnabled = previous.enabled
      if (previous.version) operation.previousVersion = previous.version
      try {
        await this.save(operation)
      } catch {
        // onRestoreRequest saves again before a restore install.
      }
      const outcome = await retainInstall(
        installRelease(
          manager,
          spec,
          {
            enabled: final.bundle.enabled,
            requestId: operation.requestId,
            saveExact: true,
          },
          previous,
          {
            onRestoreRequest: async (requestId, previousVersion) => {
              operation.restoreRequestId = requestId
              operation.previousSource = previous.source
              operation.previousEnabled = previous.enabled
              if (typeof previousVersion === 'string' && previousVersion !== '')
                operation.previousVersion = previousVersion
              try {
                await this.save(operation)
              } catch {
                // The id remains on the operation for the journal write below.
              }
            },
          },
        ),
      )
      operation.result = safeResult(outcome.result)
      if (outcome.restore) operation.restore = outcome.restore
      if (outcome.restoreRequestId) operation.restoreRequestId = outcome.restoreRequestId
      if (previous.version) operation.previousVersion = previous.version
      let installed
      try {
        installed = (await manager.listBundles()).find(item => item.name === PACKAGE)
      } catch {
        installed = undefined
      }
      operation.status = resultState(outcome.result, operation.version, this.version, installed)
      if (outcome.removed && !outcome.restore && operation.status === 'failed') operation.reinstall = true
      settleRemoval(operation, this.version)
    } catch (error) {
      operation.status = managerInvoked ? 'unknown' : 'failed'
      operation.reason = reasonOf(error)
    }
    try {
      await this.save(operation)
    } catch {
      /* Manager retains its running operation; reconcile still checks it. */
    }
  }
  async reconcile(requestId) {
    if (typeof requestId !== 'string' || !UUID.test(requestId)) throw new Error('invalid-request')
    let operation
    try {
      operation = JSON.parse(await readFile(join(this.cacheDir, `${requestId}.json`), 'utf8'))
    } catch {
      return { ...this.base(), status: 'unknown', requestId }
    }
    if (operation.requestId !== requestId || typeof operation.version !== 'string')
      return { ...this.base(), status: 'unknown', requestId }
    semanticVersion(operation.version)
    if (this.running?.requestId === requestId) return { ...this.base(), ...this.running }
    if (operation.status === 'preparing') {
      operation.status = 'failed'
      operation.reason = 'interrupted'
      await this.save(operation)
    }
    if (['installing', 'unknown'].includes(operation.status) && !operation.result) {
      const manager = this.manager()
      const result = manager && (await manager.waitForInstall(requestId))
      if (result) {
        operation.result = safeResult(result)
        // Verify the actual installed bundle below before reporting success.
      } else operation.status = 'unknown'
    }
    let restoreResult
    if (
      typeof operation.restoreRequestId === 'string' &&
      UUID.test(operation.restoreRequestId) &&
      operation.restore !== 'ok'
    ) {
      try {
        const manager = this.manager()
        restoreResult = manager ? await manager.waitForInstall(operation.restoreRequestId) : undefined
      } catch {
        restoreResult = undefined
      }
    }
    let bundle
    let listFailed = false
    try {
      bundle = (await this.manager()?.listBundles())?.find(item => item.name === PACKAGE)
    } catch (error) {
      if (!restoreResult) throw error
      // A missing list cannot prove the previous version is back. Cancellation stays cancellation.
      listFailed = true
      operation.restore = restoreResult.application === 'cancelled' ? 'cancelled' : 'unconfirmed'
      bundle = undefined
    }
    if (restoreResult && !listFailed) {
      const listed =
        bundle === undefined && !this.manager()
          ? { known: false, row: null }
          : { known: true, row: bundle?.installed ? bundle : null }
      operation.restore = classifyRestore(restoreResult, { version: operation.previousVersion }, listed)
    }
    let installed = bundle?.version
    if (operation.result) operation.status = resultState(operation.result, operation.version, this.version, bundle)
    if (
      ['installing', 'restart-required', 'unknown', 'applied'].includes(operation.status) &&
      this.version === operation.version
    ) {
      operation.status =
        bundle?.installed && !bundle.error && !bundle.readOnlyReason && installed === operation.version
          ? 'applied'
          : 'unknown'
    }
    settleRemoval(operation, this.version)
    if (operation.status === 'applied' && (operation.reason === 'reinstall' || operation.reason === 'restore-pending'))
      delete operation.reason
    if (!listFailed && bundle?.installed !== true && operation.status === 'unknown') {
      const restoredVersion = await this.restoreMissing(operation)
      if (typeof restoredVersion === 'string') installed = restoredVersion
    }
    return { ...this.base(), ...operation, installedVersion: installed }
  }
  /**
   * The package is confirmed absent and the journal is still `unknown`.
   * Install the source saved before removal. A list that is still failing is
   * not absence, so this is not called then. `restored` still requires the
   * listed version to match the saved one.
   * @param {object} operation
   * @returns {Promise<string | undefined>}
   */
  async restoreMissing(operation) {
    if (this.closed) return undefined
    const source = operation.previousSource
    const version = operation.previousVersion
    if (typeof source !== 'string' || source === '' || typeof version !== 'string' || version === '') return undefined
    const manager = this.manager()
    if (!manager || typeof manager.installBundle !== 'function' || typeof manager.listBundles !== 'function')
      return undefined
    const restore = await reinstallPrevious(
      manager,
      { source, enabled: operation.previousEnabled === true, version },
      {
        onRestoreRequest: async (requestId, previousVersion) => {
          operation.restoreRequestId = requestId
          if (typeof previousVersion === 'string' && previousVersion !== '') operation.previousVersion = previousVersion
          try {
            await this.save(operation)
          } catch {
            // The id remains on the operation for the journal write below.
          }
        },
      },
    )
    if (!restore) return undefined
    operation.restore = restore.state
    operation.restoreRequestId = restore.requestId
    settleRemoval(operation, this.version)
    if (operation.status === 'applied' && (operation.reason === 'reinstall' || operation.reason === 'restore-pending'))
      delete operation.reason
    let listed
    try {
      listed = (await manager.listBundles()).find(item => item?.name === PACKAGE && item.installed)
    } catch {
      listed = undefined
    }
    try {
      await this.save(operation)
    } catch {
      // The returned view still reports this attempt. The next reconcile reads the disk copy.
    }
    return typeof listed?.version === 'string' ? listed.version : undefined
  }
  dispose() {
    this.closed = true
    this.abort.abort()
  }
}
