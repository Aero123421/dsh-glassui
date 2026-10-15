import { createHash, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, writeFile, readFile, rename, lstat, readdir, open, rm, link } from 'node:fs/promises'
import { join, resolve, sep, basename, win32 } from 'node:path'
import { Worker } from 'node:worker_threads'
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
 * Reinstalls of a missing copy, automatic or requested from Settings.
 * The count is stored on the operation so a restart does not start over.
 */
export const RESTORE_ATTEMPT_LIMIT = 3
/** Minimum time between automatic reinstalls. A Settings reinstall does not wait for this gap. */
export const RESTORE_ATTEMPT_INTERVAL_MS = 10_000
/** How long a restore lock stays valid without renewal. */
const RESTORE_LOCK_TTL_MS = 60_000
/**
 * How often the holder extends the lock.
 * A worker renews while `installBundle` blocks the main thread.
 * The lease expires after this process exits.
 */
const RESTORE_LOCK_RENEW_MS = 15_000
/** Clock skew allowed past `Date.now()` before a future expiry is treated as not held. */
const RESTORE_LOCK_SKEW_MS = 5_000

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
 * @param {object} operation
 * @param {{ kind: string, id: string, at?: number, application?: string }} receipt
 */
function appendReceipt(operation, receipt) {
  if (!Array.isArray(operation.receipts)) operation.receipts = []
  if (operation.receipts.some(item => item && item.kind === receipt.kind && item.id === receipt.id)) return
  operation.receipts.push(receipt)
}
/**
 * @param {object} operation
 * @returns {{ source: string, enabled: boolean, version: string } | undefined}
 */
function previousSpec(operation) {
  const source = operation.previousSource
  const version = operation.previousVersion
  if (typeof source !== 'string' || source === '' || typeof version !== 'string' || version === '') return undefined
  return { source, enabled: operation.previousEnabled === true, version }
}
/**
 * This operation removed the package, and no later apply or removal was recorded.
 * `restart-required` and `applied` are later outcomes: the update finished.
 * @param {object} operation
 */
function removalProven(operation) {
  if (operation.removedByUpdate !== operation.requestId) return false
  if (operation.status === 'restart-required') return false
  const application = operation.result?.application
  if (application === 'applied' || application === 'restart-required') return false
  const receipts = Array.isArray(operation.receipts) ? operation.receipts : []
  const index = receipts.findIndex(item => item?.kind === 'removed-by-update' && item.id === operation.requestId)
  const later = index >= 0 ? receipts.slice(index + 1) : receipts
  return !later.some(item => item?.kind === 'apply' || item?.kind === 'remove')
}
/**
 * The package was present after this operation, so a later absence is someone else's removal.
 * @param {object} operation
 */
function packageWasInstalled(operation) {
  // A list that showed the package is remembered. A later absence is then someone else's removal.
  // A manual install and delete that this process never listed is the same journal as a removal
  // this update has not restored yet, so that unseen cycle still restores once.
  if (operation.observedPresent === true) return true
  if (operation.restore === 'ok' || operation.reason === 'restored' || operation.reason === 'restore-pending')
    return true
  const application = operation.result?.application
  if (application === 'applied' || application === 'restart-required') return true
  const receipts = Array.isArray(operation.receipts) ? operation.receipts : []
  return receipts.some(item => item?.kind === 'apply')
}
/**
 * A journal field lock from an older process. A future or expired timestamp is not a hold.
 * @param {object} operation
 * @param {number} now
 */
function journalLockHeld(operation, now) {
  const lock = operation.restoreLock
  if (!lock || typeof lock.at !== 'number' || !Number.isFinite(lock.at)) return false
  if (lock.at > now + RESTORE_LOCK_SKEW_MS) return false
  return now - lock.at < RESTORE_LOCK_TTL_MS
}
/**
 * @param {string} text
 * @returns {{ owner: string, requestId?: string, expiresAt: number } | null}
 */
function parseLease(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch {
    return null
  }
  if (!value || typeof value !== 'object') return null
  if (typeof value.owner !== 'string' || !UUID.test(value.owner)) return null
  if (typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt)) return null
  return value
}
/**
 * @param {{ expiresAt: number } | null} lease
 * @param {number} now
 */
function leaseHeld(lease, now) {
  if (!lease) return false
  if (lease.expiresAt <= now) return false
  if (lease.expiresAt > now + RESTORE_LOCK_TTL_MS + RESTORE_LOCK_SKEW_MS) return false
  return true
}
/**
 * @param {import('node:fs').Stats} left
 * @param {import('node:fs').Stats} right
 */
function sameFile(left, right) {
  return Boolean(left && right && left.ino && right.ino && left.dev === right.dev && left.ino === right.ino)
}
/**
 * Rename `path` only when it is still `expected`.
 * If a different file lands on `destination`, link it back onto `path` when that path is free.
 * @param {string} path
 * @param {string} destination
 * @param {import('node:fs').Stats} expected
 * @returns {Promise<boolean>}
 */
export async function renameVerified(path, destination, expected) {
  let current
  try {
    current = await lstat(path)
  } catch {
    return false
  }
  if (current.isSymbolicLink() || !sameFile(current, expected)) return false
  try {
    await rename(path, destination)
  } catch {
    return false
  }
  let moved
  try {
    moved = await lstat(destination)
  } catch {
    return false
  }
  if (sameFile(moved, expected)) return true
  try {
    await link(destination, path)
    await rm(destination, { force: true })
  } catch {
    // `path` belongs to someone else. Leave the displaced file at `destination`.
  }
  return false
}
/**
 * @param {unknown} value
 * @returns {{ requestId: string, owner: string, startedAt: number } | null}
 */
function installRecordOf(value) {
  if (!value || typeof value !== 'object') return null
  const record = /** @type {{ requestId?: unknown, owner?: unknown, startedAt?: unknown }} */ (value)
  if (typeof record.requestId !== 'string' || !UUID.test(record.requestId)) return null
  if (typeof record.owner !== 'string' || !UUID.test(record.owner)) return null
  if (typeof record.startedAt !== 'number' || !Number.isFinite(record.startedAt)) return null
  return { requestId: record.requestId, owner: record.owner, startedAt: record.startedAt }
}
/**
 * Moved-aside lock files. A live `${requestId}.restore.lock` does not match.
 * @param {string} name
 */
function isLockGrave(name) {
  return name.includes('.restore.lock.') && (name.endsWith('.stale') || name.endsWith('.release'))
}
/**
 * @param {string} name
 * @returns {string | null}
 */
function liveLockId(name) {
  if (!name.endsWith('.restore.lock')) return null
  const id = name.slice(0, -'.restore.lock'.length)
  return UUID.test(id) ? id : null
}
/**
 * Remove one expired lease. A held, unreadable, or future-dated file stays.
 * The body is read again after the rename so a renewal is put back.
 * @param {string} path
 */
async function removeExpiredLock(path) {
  let fh
  try {
    fh = await open(path, 'r')
  } catch {
    return
  }
  let expected
  let body
  try {
    const fhStat = await fh.stat()
    const pathStat = await lstat(path)
    if (pathStat.isSymbolicLink() || !pathStat.isFile() || !sameFile(fhStat, pathStat)) return
    expected = pathStat
    body = parseLease(await readFile(fh, 'utf8'))
  } catch {
    return
  } finally {
    await fh.close().catch(() => {})
  }
  if (!expected || !body || body.expiresAt > Date.now()) return
  let againStat
  let again
  try {
    againStat = await lstat(path)
    if (againStat.isSymbolicLink() || !sameFile(againStat, expected)) return
    again = parseLease(await readFile(path, 'utf8'))
  } catch {
    return
  }
  if (!again || again.expiresAt > Date.now()) return
  const grave = `${path}.${randomUUID()}.stale`
  if (!(await renameVerified(path, grave, againStat))) return
  let moved
  try {
    moved = parseLease(await readFile(grave, 'utf8'))
  } catch {
    moved = null
  }
  if (!moved || moved.expiresAt > Date.now()) {
    try {
      await link(grave, path)
      await rm(grave, { force: true })
    } catch {
      // The path belongs to a newer lease. Leave the grave in place.
    }
    return
  }
  await rm(grave, { force: true }).catch(() => {})
}
/**
 * Delete lock graves older than the lease lifetime, and expired live leases.
 * A held `${requestId}.restore.lock` stays. Unreadable and future-dated leases stay for takeover.
 * @param {string} directory
 */
async function sweepLockGraves(directory) {
  let names
  try {
    names = await readdir(directory)
  } catch {
    return
  }
  await Promise.all(names.filter(name => liveLockId(name)).map(name => removeExpiredLock(join(directory, name))))
  let graves
  try {
    graves = await readdir(directory)
  } catch {
    return
  }
  const cutoff = Date.now() - RESTORE_LOCK_TTL_MS - RESTORE_LOCK_SKEW_MS
  await Promise.all(
    graves.map(async name => {
      if (!isLockGrave(name)) return
      const path = join(directory, name)
      let stat
      try {
        stat = await lstat(path)
      } catch {
        return
      }
      if (!stat.isFile() || stat.isSymbolicLink()) return
      if (stat.mtimeMs > cutoff) return
      await rm(path, { force: true }).catch(() => {})
    }),
  )
}
/**
 * @param {import('node:fs/promises').FileHandle} handle
 * @param {string} body
 */
async function writeHandle(handle, body) {
  const bytes = Buffer.from(body)
  await handle.write(bytes, 0, bytes.length, 0)
  await handle.truncate(bytes.length)
}
const LOCK_RENEWER_SOURCE = `
import { open, readFile, lstat } from 'node:fs/promises'
import { workerData } from 'node:worker_threads'
const { path, owner, requestId, ttl, interval } = workerData
function parse(text) {
  try {
    const value = JSON.parse(text)
    if (!value || value.owner !== owner || value.requestId !== requestId) return null
    if (typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt)) return null
    return value
  } catch {
    return null
  }
}
async function renew() {
  let fh
  try {
    fh = await open(path, 'r+')
  } catch {
    return
  }
  try {
    const fhStat = await fh.stat()
    const pathStat = await lstat(path)
    if (pathStat.isSymbolicLink() || !pathStat.isFile()) return
    if (fhStat.ino !== pathStat.ino || fhStat.dev !== pathStat.dev) return
    if (!parse(await readFile(fh, 'utf8'))) return
    const next = JSON.stringify({ owner, requestId, expiresAt: Date.now() + ttl })
    const bytes = Buffer.from(next)
    await fh.write(bytes, 0, bytes.length, 0)
    await fh.truncate(bytes.length)
    const again = await lstat(path)
    const fhAgain = await fh.stat()
    if (again.ino !== fhAgain.ino || again.dev !== fhAgain.dev) return
    if (!parse(await readFile(path, 'utf8'))) return
  } catch {
    // The next interval tries again. A dead parent terminates this thread.
  } finally {
    await fh.close().catch(() => {})
  }
}
await renew()
setInterval(() => {
  void renew()
}, interval)
`
/**
 * Renew the lease from a thread that still runs when `installBundle` blocks the main thread.
 * @param {{ path: string, owner: string, requestId: string }} lock
 * @returns {Worker | null}
 */
function startLockRenewer(lock) {
  try {
    const worker = new Worker(LOCK_RENEWER_SOURCE, {
      eval: true,
      workerData: {
        path: lock.path,
        owner: lock.owner,
        requestId: lock.requestId,
        ttl: RESTORE_LOCK_TTL_MS,
        interval: RESTORE_LOCK_RENEW_MS,
      },
    })
    worker.unref()
    worker.on('error', () => {
      // The main-thread timer still renews while this thread is down.
    })
    return worker
  } catch {
    return null
  }
}
/**
 * @param {Worker | null} worker
 */
async function stopLockRenewer(worker) {
  if (!worker) return
  await worker.terminate().catch(() => {})
}
/**
 * @param {{ queue: Promise<void> }} lock
 * @param {() => Promise<unknown>} fn
 */
function enqueueLock(lock, fn) {
  const run = lock.queue.then(fn, fn)
  lock.queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}
/**
 * @param {string} path
 * @returns {Promise<{ lease: { owner: string, requestId?: string, expiresAt: number } | null, missing: boolean }>}
 */
async function readLeaseStable(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const lease = parseLease(await readFile(path, 'utf8'))
      if (lease) return { lease, missing: false }
    } catch (error) {
      if (error?.code === 'ENOENT') return { lease: null, missing: true }
    }
  }
  return { lease: null, missing: false }
}
/**
 * Publish a complete lease. The path appears only after the body is written.
 * @param {string} path
 * @param {string} requestId
 * @param {string} owner
 */
async function publishLock(path, requestId, owner) {
  const temp = `${path}.${randomUUID()}.locktmp`
  const body = JSON.stringify({ owner, requestId, expiresAt: Date.now() + RESTORE_LOCK_TTL_MS })
  let fh
  try {
    fh = await open(temp, 'wx', 0o600)
  } catch (error) {
    if (error?.code === 'EEXIST') return null
    throw error
  }
  try {
    await writeHandle(fh, body)
    await link(temp, path)
  } catch (error) {
    await fh.close().catch(() => {})
    await rm(temp, { force: true }).catch(() => {})
    if (error?.code === 'EEXIST') return null
    throw error
  }
  await rm(temp, { force: true }).catch(() => {})
  return { fh, path, owner, requestId, queue: Promise.resolve(), lost: false }
}
/**
 * @param {unknown[] | undefined} left
 * @param {unknown[] | undefined} right
 */
function unionReceipts(left, right) {
  /** @type {{ kind: string, id: string }[]} */
  const out = []
  const items = [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])]
  for (const item of items) {
    if (!item || typeof item.kind !== 'string' || typeof item.id !== 'string') continue
    if (out.some(existing => existing.kind === item.kind && existing.id === item.id)) continue
    out.push(item)
  }
  return out
}
/**
 * @param {object} operation
 * @param {object} disk
 */
function absorbMonotonic(operation, disk) {
  operation.restoreAttempts = Math.max(attemptsOf(disk), attemptsOf(operation))
  const diskAt =
    typeof disk.restoreAttemptAt === 'number' && Number.isFinite(disk.restoreAttemptAt) ? disk.restoreAttemptAt : 0
  const opAt =
    typeof operation.restoreAttemptAt === 'number' && Number.isFinite(operation.restoreAttemptAt)
      ? operation.restoreAttemptAt
      : 0
  if (diskAt || opAt) operation.restoreAttemptAt = Math.max(diskAt, opAt)
  operation.observedPresent = Boolean(disk.observedPresent || operation.observedPresent)
  operation.receipts = unionReceipts(disk.receipts, operation.receipts)
  delete operation.restoreLock
  const settledId = typeof operation.restoreInstallSettledId === 'string' ? operation.restoreInstallSettledId : ''
  const drop = operation.restoreInstallDrop === true
  delete operation.restoreInstallSettledId
  delete operation.restoreInstallDrop
  const memory = installRecordOf(operation.restoreInstall)
  const stored = installRecordOf(disk.restoreInstall)
  const diskPresent = disk.restoreInstall != null
  const clearing = operation.restoreInstall === null && UUID.test(settledId)
  if (drop) delete operation.restoreInstall
  else if (clearing && (!diskPresent || stored?.requestId === settledId)) delete operation.restoreInstall
  else if (stored && memory) operation.restoreInstall = memory.startedAt >= stored.startedAt ? memory : stored
  // A later start is this operation's request id. An older disk record does not replace it.
  else if (diskPresent && !memory) operation.restoreInstall = stored ?? disk.restoreInstall
  else if (memory) operation.restoreInstall = memory
  else delete operation.restoreInstall
}
/**
 * @param {Manager} manager
 * @returns {Promise<'absent' | 'present' | 'unknown'>}
 */
async function listedPackage(manager) {
  try {
    const listed = await manager.listBundles()
    if (!Array.isArray(listed)) return 'unknown'
    return listed.some(item => item?.name === PACKAGE && item.installed) ? 'present' : 'absent'
  } catch {
    return 'unknown'
  }
}
/**
 * @param {object} operation
 */
function attemptsOf(operation) {
  return Number.isSafeInteger(operation.restoreAttempts) && operation.restoreAttempts > 0
    ? operation.restoreAttempts
    : 0
}
/**
 * @param {object} operation
 * @param {{ absent: boolean, installUnresolved: boolean, now: number, cacheDir: string | undefined, lockHeld?: boolean, directoryUnread?: boolean, priorUnsettled?: boolean }} facts
 * @returns {'skip' | 'auto' | 'offer' | 'limit' | 'inflight' | 'wait' | 'invalid-source'}
 */
function restorePlan(
  operation,
  { absent, installUnresolved, now, cacheDir, lockHeld = false, directoryUnread = false, priorUnsettled = false },
) {
  if (!absent) return 'skip'
  if (operation.reason === 'restored' || operation.reason === 'restore-failed') return 'skip'
  const spec = previousSpec(operation)
  if (!spec) return 'skip'
  try {
    sourceKind(spec.source, cacheDir, spec.version)
  } catch {
    return 'invalid-source'
  }
  if (lockHeld) return 'inflight'
  if (priorUnsettled) return 'offer'
  if (attemptsOf(operation) >= RESTORE_ATTEMPT_LIMIT) return 'limit'
  const recent =
    typeof operation.restoreAttemptAt === 'number' && now - operation.restoreAttemptAt < RESTORE_ATTEMPT_INTERVAL_MS
  const proven = removalProven(operation) && operation.status === 'unknown'
  if (proven && recent && !directoryUnread && !installUnresolved) return 'wait'
  if (proven && !installUnresolved && !directoryUnread) return 'auto'
  return 'offer'
}
/**
 * `waitForInstall` returns null when this process has no active request.
 * Completed results are not retained, so null does not prove another process finished.
 * @param {Manager | undefined} manager
 * @param {string} requestId
 */
async function installStillElsewhere(manager, requestId) {
  if (typeof requestId !== 'string' || !UUID.test(requestId)) return true
  if (!manager || typeof manager.waitForInstall !== 'function') return true
  try {
    return !(await manager.waitForInstall(updateRequestId(requestId)))
  } catch {
    return true
  }
}
/**
 * Install the spec captured before removal. The request id is published before
 * `installBundle` so a restart can reconcile that id if this process stops.
 * A journal source is checked with the current source rules before that install.
 * When `blockIfIdleRequest` is set, a null `waitForInstall` refuses the install:
 * another process may still be installing that request.
 * `confirmAbsent` runs after the restore request is recorded and immediately before
 * the install record is written. A present package or a failed list does not install.
 * `noteInstallStart` records that request id before `installBundle`. A later process
 * does not install over an unsettled record. If the record cannot be saved, or the
 * lock is already lost, this call does not install.
 * @param {Manager} manager
 * @param {{ source?: string, enabled?: boolean, version?: string } | undefined} previous
 * @param {RestoreHooks | undefined} hooks
 * @returns {Promise<{ state: RestoreState, requestId: string } | undefined>}
 */
async function reinstallPrevious(manager, previous, hooks) {
  const source = previous?.source
  if (typeof source !== 'string' || source === '') return undefined
  if (hooks?.validateSource) {
    try {
      sourceKind(source, hooks.cacheDir, previous.version)
    } catch {
      return undefined
    }
  }
  if (typeof hooks?.blockIfIdleRequest === 'string' && (await installStillElsewhere(manager, hooks.blockIfIdleRequest)))
    return undefined
  const requestId = updateRequestId()
  if (hooks?.onRestoreRequest) await hooks.onRestoreRequest(requestId, previous.version)
  if (hooks?.stillOwned && !(await hooks.stillOwned())) return undefined
  if (hooks?.confirmAbsent && !(await hooks.confirmAbsent())) return undefined
  if (hooks?.noteInstallStart && !(await hooks.noteInstallStart(requestId))) return undefined
  if (hooks?.abandoned?.()) return undefined
  if (hooks?.stillOwned && !(await hooks.stillOwned())) return undefined
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
 * A confirmed removal calls `hooks.onRemoved` before the follow-up install so the
 * journal can show that this operation removed the package.
 * @param {Manager} manager
 * @param {string} spec
 * @param {import('@deepseek-ai/dsh-plugin-manager/types').InstallBundleOptions} options
 * @param {{ source?: string, enabled?: boolean, version?: string } | undefined} [previous]
 * @param {{ onRestoreRequest?: (requestId: string, previousVersion?: string) => Promise<void> | void, onRemoved?: () => Promise<void> | void } | undefined} [hooks]
 */
async function rememberRemoval(hooks) {
  if (typeof hooks?.onRemoved === 'function') await hooks.onRemoved()
}
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
    if (listed.known && !listed.row) {
      await rememberRemoval(hooks)
      return removalNeedsRestore(manager, removed, previous, hooks)
    }
    try {
      return { result: await manager.installBundle(spec, options), removed: false }
    } catch {
      return { result: failedInstall(), removed: false }
    }
  }
  if (!removalAccepted(removed)) {
    const listed = await installedCopy(manager)
    if (!listed.known) return { result: removed ?? installed, removed: true, restore: 'unconfirmed' }
    if (!listed.row) {
      await rememberRemoval(hooks)
      return removalNeedsRestore(manager, removed ?? installed, previous, hooks)
    }
    return { result: removed ?? installed, removed: false }
  }
  await rememberRemoval(hooks)
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
    removalProven: true,
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
    removalProven: true,
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
    /** @type {Map<string, Promise<string | undefined>>} */
    this.restoreFlights = new Map()
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
            onRemoved: async () => {
              operation.removedByUpdate = operation.requestId
              if (typeof operation.removedAt !== 'number') operation.removedAt = Date.now()
              appendReceipt(operation, {
                kind: 'removed-by-update',
                id: operation.requestId,
                at: operation.removedAt,
              })
              try {
                await this.save(operation)
              } catch {
                // execute writes the marker again after installRelease returns.
              }
            },
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
      if (outcome.removalProven) {
        operation.removedByUpdate = operation.requestId
        if (typeof operation.removedAt !== 'number') operation.removedAt = Date.now()
        appendReceipt(operation, {
          kind: 'removed-by-update',
          id: operation.requestId,
          at: operation.removedAt,
        })
      }
      const application = outcome.result?.application
      if (application === 'applied' || application === 'restart-required') {
        operation.recordedAt = Date.now()
        appendReceipt(operation, {
          kind: 'apply',
          id: operation.requestId,
          at: operation.recordedAt,
          application,
        })
      }
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
    let installUnresolved = false
    if (['installing', 'unknown'].includes(operation.status) && !operation.result) {
      const manager = this.manager()
      let result
      try {
        result = manager && (await manager.waitForInstall(requestId))
      } catch {
        result = null
      }
      if (result) {
        operation.result = safeResult(result)
        // Verify the actual installed bundle below before reporting success.
      } else {
        // Null is not a finished install. Another process may still be installing this request.
        operation.status = 'unknown'
        installUnresolved = true
      }
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
    const absent = !listFailed && bundle?.installed !== true
    const sawPresent = !listFailed && bundle?.installed === true
    const presenceChanged = sawPresent && operation.observedPresent !== true
    if (sawPresent) {
      operation.observedPresent = true
      if (operation.restoreInstall != null) this.markInstallFinished(operation)
    }
    if (this.cacheDir) await sweepLockGraves(this.cacheDir)
    const receiptsBefore = Array.isArray(operation.receipts) ? operation.receipts.length : 0
    if (
      absent &&
      operation.reason !== 'restored' &&
      operation.reason !== 'restore-failed' &&
      packageWasInstalled(operation)
    )
      appendReceipt(operation, { kind: 'remove', id: operation.requestId, at: Date.now() })
    let directoryUnread = false
    if (absent && removalProven(operation)) {
      const foreign = await this.laterForeignReceipt(operation)
      if (foreign === true)
        appendReceipt(operation, { kind: 'apply', id: `foreign:${operation.requestId}`, at: Date.now() })
      else if (foreign === 'unreadable') directoryUnread = true
    }
    const receiptAdded = (Array.isArray(operation.receipts) ? operation.receipts.length : 0) > receiptsBefore
    let priorUnsettled = false
    if (absent && operation.restoreInstall != null && operation.restore !== 'ok' && operation.reason !== 'restored') {
      const record = installRecordOf(operation.restoreInstall)
      let prior = null
      if (record) {
        try {
          const manager = this.manager()
          prior =
            manager && typeof manager.waitForInstall === 'function'
              ? await manager.waitForInstall(record.requestId)
              : null
        } catch {
          prior = null
        }
      }
      if (prior && record) {
        operation.restore = classifyRestore(
          prior,
          { version: operation.previousVersion },
          {
            known: !listFailed,
            row: !listFailed && bundle?.installed ? bundle : null,
          },
        )
        operation.restoreRequestId = record.requestId
        settleRemoval(operation, this.version)
        this.markInstallFinished(operation)
      } else priorUnsettled = true
    }
    const lockHeld = journalLockHeld(operation, Date.now()) || (await this.fileLockHeld(operation.requestId))
    const plan = restorePlan(operation, {
      absent,
      installUnresolved,
      now: Date.now(),
      cacheDir: this.cacheDir,
      lockHeld,
      directoryUnread,
      priorUnsettled,
    })
    const journalTouched =
      presenceChanged || receiptAdded || operation.restoreInstallSettledId || operation.restoreInstallDrop === true
    if (journalTouched && plan !== 'auto') await this.persistRestoreJournal(operation)
    delete operation.restoreInstallSettledId
    delete operation.restoreInstallDrop
    if (plan === 'auto') {
      const restoredVersion = await this.restoreMissing(operation)
      if (typeof restoredVersion === 'string') installed = restoredVersion
    } else if (plan === 'offer') operation.reason = 'restore-offer'
    else if (plan === 'limit') operation.reason = 'restore-limit'
    else if (plan === 'invalid-source') operation.reason = 'source'
    return { ...this.base(), ...operation, installedVersion: installed }
  }
  /**
   * Another operation journal recorded an apply or removal after this one removed the package.
   * One unreadable sibling is read again and, if it is still broken, renamed aside under a
   * name that includes the time and a random id. If the directory itself cannot be
   * read, this pass does not treat that as a later receipt for every operation.
   * @param {object} operation
   * @returns {Promise<boolean | 'unreadable'>}
   */
  async laterForeignReceipt(operation) {
    let names
    try {
      names = await readdir(this.cacheDir)
    } catch {
      return 'unreadable'
    }
    const receipts = Array.isArray(operation.receipts) ? operation.receipts : []
    const marker = receipts.find(item => item?.kind === 'removed-by-update' && item.id === operation.requestId)
    const at =
      typeof marker?.at === 'number' ? marker.at : typeof operation.removedAt === 'number' ? operation.removedAt : 0
    for (const name of names) {
      if (!name.endsWith('.json') || name === 'latest.json') continue
      const id = name.slice(0, -5)
      if (id === operation.requestId || !UUID.test(id)) continue
      let other
      try {
        other = JSON.parse(await readFile(join(this.cacheDir, name), 'utf8'))
      } catch (error) {
        if (error?.code !== 'ENOENT') await this.quarantineJournal(name)
        continue
      }
      const otherReceipts = Array.isArray(other?.receipts) ? other.receipts : []
      if (
        otherReceipts.some(
          item => (item?.kind === 'apply' || item?.kind === 'remove') && typeof item.at === 'number' && item.at > at,
        )
      )
        return true
      const application = other?.result?.application
      if (
        (application === 'applied' || application === 'restart-required') &&
        typeof other?.recordedAt === 'number' &&
        other.recordedAt > at
      )
        return true
    }
    return false
  }
  /**
   * Install the saved previous spec once per operation in this process.
   * A second caller waits for that install instead of starting another.
   * Automatic installs require a proven removal. Settings passes `manual`.
   * @param {object} operation
   * @param {{ manual?: boolean }} [options]
   * @returns {Promise<string | undefined>}
   */
  async restoreMissing(operation, options = {}) {
    const id = operation.requestId
    if (typeof id !== 'string') return undefined
    const existing = this.restoreFlights.get(id)
    if (existing) {
      const version = await existing
      await this.copyJournal(operation)
      return version
    }
    let release
    const opened = new Promise(resolve => {
      release = resolve
    })
    const flight = (async () => {
      await opened
      return this.restoreMissingOwned(operation, options)
    })()
    this.restoreFlights.set(id, flight)
    release()
    try {
      return await flight
    } finally {
      if (this.restoreFlights.get(id) === flight) this.restoreFlights.delete(id)
    }
  }
  /**
   * @param {object} operation
   */
  async copyJournal(operation) {
    try {
      const saved = JSON.parse(await readFile(join(this.cacheDir, `${operation.requestId}.json`), 'utf8'))
      if (saved?.requestId === operation.requestId) Object.assign(operation, saved)
    } catch {
      // The owner still returns the version it observed.
    }
  }
  /**
   * @param {object} operation
   * @param {{ manual?: boolean }} options
   * @returns {Promise<string | undefined>}
   */
  async restoreMissingOwned(operation, { manual = false } = {}) {
    if (this.closed) return undefined
    const spec = previousSpec(operation)
    if (!spec) return undefined
    try {
      sourceKind(spec.source, this.cacheDir, spec.version)
    } catch {
      operation.reason = 'source'
      return undefined
    }
    if (!manual && !removalProven(operation)) return undefined
    if (!manual && !operation.result) return undefined
    const manager = this.manager()
    if (!manager || typeof manager.installBundle !== 'function' || typeof manager.listBundles !== 'function')
      return undefined
    if (journalLockHeld(operation, Date.now())) return undefined
    const lock = await this.acquireRestoreLock(operation.requestId)
    if (!lock) return undefined
    const timer = setInterval(() => {
      void this.renewRestoreLock(lock).then(
        ok => {
          if (!ok) lock.lost = true
        },
        () => {
          lock.lost = true
        },
      )
    }, RESTORE_LOCK_RENEW_MS)
    timer.unref?.()
    const renewer = startLockRenewer(lock)
    try {
      if (this.closed) return undefined
      await this.reloadOperation(operation)
      const current = previousSpec(operation)
      if (!current) return undefined
      try {
        sourceKind(current.source, this.cacheDir, current.version)
      } catch {
        operation.reason = 'source'
        return undefined
      }
      if (journalLockHeld(operation, Date.now())) return undefined
      const now = Date.now()
      if (!manual && attemptsOf(operation) >= RESTORE_ATTEMPT_LIMIT) {
        operation.reason = 'restore-limit'
        await this.saveMerged(operation)
        return undefined
      }
      const recent =
        typeof operation.restoreAttemptAt === 'number' && now - operation.restoreAttemptAt < RESTORE_ATTEMPT_INTERVAL_MS
      if (!manual && recent) return undefined
      if (!manual && !removalProven(operation)) return undefined
      if (!manual && !operation.result) return undefined
      const presence = await listedPackage(manager)
      if (presence !== 'absent') {
        if (presence === 'present') {
          operation.observedPresent = true
          if (operation.restoreInstall != null) this.markInstallFinished(operation)
          try {
            await this.saveMerged(operation)
          } catch {
            // The caller still returns the listed version.
          }
          return await this.listedVersion()
        }
        return undefined
      }
      const pending = await this.blockOnUnsettledInstall(operation, manager, manual)
      if (pending === 'settled') return await this.listedVersion()
      if (pending === 'offer') return undefined
      operation.restoreAttempts = attemptsOf(operation) + 1
      operation.restoreAttemptAt = now
      delete operation.restoreLock
      try {
        await this.saveMerged(operation)
      } catch {
        return undefined
      }
      const restore = await reinstallPrevious(manager, current, {
        validateSource: true,
        cacheDir: this.cacheDir,
        stillOwned: async () => {
          if (lock.lost) return false
          const ok = await this.renewRestoreLock(lock)
          if (!ok) lock.lost = true
          return ok
        },
        confirmAbsent: async () => (await listedPackage(manager)) === 'absent',
        noteInstallStart: async requestId => {
          if (lock.lost) return false
          if (!(await this.renewRestoreLock(lock))) {
            lock.lost = true
            return false
          }
          operation.restoreInstall = { requestId, owner: lock.owner, startedAt: Date.now() }
          operation.restoreRequestId = requestId
          try {
            await this.saveMerged(operation)
          } catch {
            delete operation.restoreInstall
            return false
          }
          const kept = installRecordOf(operation.restoreInstall)
          if (!kept || kept.requestId !== requestId) return false
          if (!(await this.renewRestoreLock(lock))) {
            lock.lost = true
            return false
          }
          return true
        },
        abandoned: () => lock.lost === true,
        onRestoreRequest: async (requestId, previousVersion) => {
          operation.restoreRequestId = requestId
          if (typeof previousVersion === 'string' && previousVersion !== '') operation.previousVersion = previousVersion
          try {
            await this.saveMerged(operation)
          } catch {
            // The id remains on the operation for the journal write below.
          }
        },
      })
      if (!restore) return undefined
      operation.restore = restore.state
      operation.restoreRequestId = restore.requestId
      settleRemoval(operation, this.version)
      if (
        operation.status === 'applied' &&
        (operation.reason === 'reinstall' || operation.reason === 'restore-pending')
      )
        delete operation.reason
      await this.finishRestoreInstall(operation, lock, restore.requestId)
      return await this.listedVersion()
    } finally {
      clearInterval(timer)
      await stopLockRenewer(renewer)
      await this.releaseRestoreLock(lock)
    }
  }
  /**
   * Forget the in-flight restore install. A readable record is cleared only when
   * the disk copy is still that request id. An unreadable record is dropped.
   * @param {object} operation
   */
  markInstallFinished(operation) {
    if (operation.restoreInstall == null) return
    const record = installRecordOf(operation.restoreInstall)
    operation.restoreInstall = null
    if (record) operation.restoreInstallSettledId = record.requestId
    else operation.restoreInstallDrop = true
  }
  /**
   * A previous restore install has a result in this process. Record that outcome
   * and clear its id. The caller holds the restore lock.
   * @param {object} operation
   * @param {{ requestId: string, owner: string, startedAt: number }} record
   * @param {object} result
   */
  async rememberSettledInstall(operation, record, result) {
    const listed = await installedCopy(this.manager())
    operation.restore = classifyRestore(result, { version: operation.previousVersion }, listed)
    operation.restoreRequestId = record.requestId
    settleRemoval(operation, this.version)
    if (operation.status === 'applied' && (operation.reason === 'reinstall' || operation.reason === 'restore-pending'))
      delete operation.reason
    this.markInstallFinished(operation)
    try {
      await this.saveMerged(operation)
    } catch {
      // The caller still reports the settled view.
    }
  }
  /**
   * Automatic restore does not start while an earlier restore install is unsettled.
   * Settings checks the bundle list before installing over an unknown result.
   * A present package is not installed again. A known result is recorded and not started again.
   * @param {object} operation
   * @param {Manager} manager
   * @param {boolean} manual
   * @returns {Promise<false | 'offer' | 'settled'>}
   */
  async blockOnUnsettledInstall(operation, manager, manual) {
    if (operation.restoreInstall == null) return false
    const record = installRecordOf(operation.restoreInstall)
    let prior = null
    if (record && typeof manager.waitForInstall === 'function') {
      try {
        prior = await manager.waitForInstall(record.requestId)
      } catch {
        prior = null
      }
    }
    if (prior && record) {
      await this.rememberSettledInstall(operation, record, prior)
      return 'settled'
    }
    if (manual) {
      const presence = await listedPackage(manager)
      if (presence === 'present') {
        operation.observedPresent = true
        this.markInstallFinished(operation)
        try {
          await this.saveMerged(operation)
        } catch {
          // The caller still reports the listed package.
        }
        return 'settled'
      }
      if (presence !== 'absent') {
        operation.reason = 'restore-offer'
        try {
          await this.saveMerged(operation)
        } catch {
          // The view still offers a manual reinstall.
        }
        return 'offer'
      }
      return false
    }
    operation.reason = 'restore-offer'
    try {
      await this.saveMerged(operation)
    } catch {
      // The view still offers a manual reinstall.
    }
    return 'offer'
  }
  /**
   * Clear the install record for `requestId` while holding a lock.
   * If this lease was lost, take the lock again. If that fails, leave the record
   * so another process does not auto-install over an unknown result.
   * @param {object} operation
   * @param {{ fh: import('node:fs/promises').FileHandle, path: string, owner: string, requestId: string, queue: Promise<void>, lost: boolean }} lock
   * @param {string} requestId
   */
  async finishRestoreInstall(operation, lock, requestId) {
    operation.restoreInstall = null
    operation.restoreInstallSettledId = requestId
    const write = async () => {
      await this.saveMerged(operation)
    }
    let held = false
    if (!lock.lost) held = await this.renewRestoreLock(lock)
    if (!held) lock.lost = true
    if (held) {
      try {
        await write()
      } catch {
        // The next reconcile reads the disk copy.
      }
      delete operation.restoreInstallSettledId
      return
    }
    const again = await this.acquireRestoreLock(operation.requestId)
    if (!again) {
      delete operation.restoreInstallSettledId
      return
    }
    try {
      await write()
    } catch {
      // Leave the marker when the merged write fails.
    } finally {
      delete operation.restoreInstallSettledId
      await this.releaseRestoreLock(again)
    }
  }
  /**
   * @param {string} requestId
   */
  async fileLockHeld(requestId) {
    if (!this.cacheDir || typeof requestId !== 'string' || !UUID.test(requestId)) return false
    const seen = await readLeaseStable(join(this.cacheDir, `${requestId}.restore.lock`))
    return leaseHeld(seen.lease, Date.now())
  }
  /**
   * Exclusive lock file. Expired, unreadable, and absurdly future leases can be taken over
   * by renaming them aside; only one rename wins.
   * @param {string} requestId
   */
  async acquireRestoreLock(requestId) {
    if (typeof requestId !== 'string' || !UUID.test(requestId)) return null
    const directory = await this.privateDir()
    await sweepLockGraves(directory)
    const path = join(directory, `${requestId}.restore.lock`)
    const owner = randomUUID()
    for (let attempt = 0; attempt < 2; attempt++) {
      const created = await publishLock(path, requestId, owner)
      if (created) return created
      const seen = await readLeaseStable(path)
      if (seen.missing) continue
      if (leaseHeld(seen.lease, Date.now())) return null
      const taken = await this.takeoverRestoreLock(path, requestId, owner)
      if (taken) return taken
    }
    return null
  }
  /**
   * @param {string} path
   * @param {string} requestId
   * @param {string} owner
   */
  async takeoverRestoreLock(path, requestId, owner) {
    let fh
    try {
      fh = await open(path, 'r')
    } catch {
      return null
    }
    let expected
    let body = null
    try {
      const fhStat = await fh.stat()
      const pathStat = await lstat(path)
      if (!pathStat.isSymbolicLink() && sameFile(fhStat, pathStat)) {
        expected = pathStat
        body = parseLease(await readFile(fh, 'utf8'))
      }
    } catch {
      expected = undefined
    } finally {
      await fh.close().catch(() => {})
    }
    if (!expected || leaseHeld(body, Date.now())) return null
    const grave = `${path}.${randomUUID()}.stale`
    if (!(await renameVerified(path, grave, expected))) return null
    let moved
    try {
      moved = parseLease(await readFile(grave, 'utf8'))
    } catch {
      moved = null
    }
    if (leaseHeld(moved, Date.now())) {
      try {
        await link(grave, path)
        await rm(grave, { force: true })
      } catch {
        // The path belongs to someone else. Leave the grave in place.
      }
      return null
    }
    try {
      return await publishLock(path, requestId, owner)
    } finally {
      await rm(grave, { force: true }).catch(() => {})
    }
  }
  /**
   * @param {{ fh: import('node:fs/promises').FileHandle, path: string, owner: string, requestId: string, queue: Promise<void>, lost: boolean }} lock
   */
  async renewRestoreLock(lock) {
    return enqueueLock(lock, async () => {
      let fhStat
      let pathStat
      try {
        fhStat = await lock.fh.stat()
        pathStat = await lstat(lock.path)
      } catch {
        return false
      }
      if (!sameFile(fhStat, pathStat)) return false
      const body = JSON.stringify({
        owner: lock.owner,
        requestId: lock.requestId,
        expiresAt: Date.now() + RESTORE_LOCK_TTL_MS,
      })
      try {
        await writeHandle(lock.fh, body)
        const again = await lstat(lock.path)
        const fhAgain = await lock.fh.stat()
        if (!sameFile(again, fhAgain)) return false
        const seen = parseLease(await readFile(lock.path, 'utf8'))
        return Boolean(seen && seen.owner === lock.owner && leaseHeld(seen, Date.now()))
      } catch {
        return false
      }
    })
  }
  /**
   * Remove the lock only when this holder still owns the file that was renamed aside.
   * @param {{ fh: import('node:fs/promises').FileHandle, path: string, owner: string, requestId: string, queue: Promise<void>, lost: boolean } | null} lock
   */
  async releaseRestoreLock(lock) {
    if (!lock) return
    await enqueueLock(lock, async () => {
      let fhStat
      let pathStat
      try {
        fhStat = await lock.fh.stat()
        pathStat = await lstat(lock.path)
      } catch {
        return
      }
      if (pathStat.isSymbolicLink() || !sameFile(fhStat, pathStat)) return
      const grave = `${lock.path}.${randomUUID()}.release`
      if (!(await renameVerified(lock.path, grave, pathStat))) return
      let mine
      try {
        const graveStat = await lstat(grave)
        const body = parseLease(await readFile(grave, 'utf8'))
        mine = sameFile(fhStat, graveStat) && body?.owner === lock.owner
      } catch {
        mine = false
      }
      if (mine) {
        await rm(grave, { force: true }).catch(() => {})
        return
      }
      try {
        await link(grave, lock.path)
        await rm(grave, { force: true }).catch(() => {})
      } catch {
        // The path was claimed. Leave the displaced lease under the grave name.
      }
    })
    await lock.fh.close().catch(() => {})
  }
  /**
   * @param {string} name
   */
  async quarantineJournal(name) {
    if (!name.endsWith('.json') || name === 'latest.json') return
    const id = name.slice(0, -5)
    if (!UUID.test(id)) return
    const path = join(this.cacheDir, name)
    let fh
    try {
      fh = await open(path, 'r')
    } catch {
      return
    }
    let expected
    let text
    try {
      const fhStat = await fh.stat()
      const pathStat = await lstat(path)
      if (pathStat.isSymbolicLink() || !sameFile(fhStat, pathStat)) return
      expected = pathStat
      text = await readFile(fh, 'utf8')
    } catch {
      return
    } finally {
      await fh.close().catch(() => {})
    }
    if (!expected) return
    try {
      JSON.parse(text)
      return
    } catch {
      // The first read is not JSON. Confirm that again immediately before the rename.
    }
    let againStat
    let again
    try {
      againStat = await lstat(path)
      if (againStat.isSymbolicLink() || !sameFile(againStat, expected)) return
      again = await readFile(path, 'utf8')
    } catch {
      return
    }
    try {
      JSON.parse(again)
      return
    } catch {
      // Still broken. Keep this inode under a name that a later quarantine will not reuse.
    }
    const destination = join(this.cacheDir, `${name}.${Date.now()}.${randomUUID()}.quarantine`)
    await renameVerified(path, destination, againStat)
  }
  /**
   * @param {object} operation
   */
  async reloadOperation(operation) {
    try {
      const disk = JSON.parse(await readFile(join(this.cacheDir, `${operation.requestId}.json`), 'utf8'))
      if (!disk || disk.requestId !== operation.requestId) return
      for (const key of Object.keys(operation)) {
        if (!(key in disk)) delete operation[key]
      }
      Object.assign(operation, disk)
    } catch {
      // Keep the in-memory operation when the journal cannot be read.
    }
  }
  /**
   * Re-read the journal under the caller's lock and keep attempt counts that another
   * process already recorded.
   * @param {object} operation
   */
  async saveMerged(operation) {
    let disk = {}
    try {
      const parsed = JSON.parse(await readFile(join(this.cacheDir, `${operation.requestId}.json`), 'utf8'))
      if (parsed?.requestId === operation.requestId) disk = parsed
    } catch {
      disk = {}
    }
    absorbMonotonic(operation, disk)
    await this.save(operation)
  }
  /**
   * @param {object} operation
   */
  async persistRestoreJournal(operation) {
    if (this.closed || journalLockHeld(operation, Date.now())) return false
    const lock = await this.acquireRestoreLock(operation.requestId)
    if (!lock) return false
    try {
      await this.saveMerged(operation)
      return true
    } catch {
      return false
    } finally {
      await this.releaseRestoreLock(lock)
    }
  }
  /** @returns {Promise<string | undefined>} */
  async listedVersion() {
    const manager = this.manager()
    if (!manager || typeof manager.listBundles !== 'function') return undefined
    try {
      const listed = (await manager.listBundles()).find(item => item?.name === PACKAGE && item.installed)
      return typeof listed?.version === 'string' ? listed.version : undefined
    } catch {
      return undefined
    }
  }
  /**
   * Settings asked to put the previous version back. This does not run for an
   * automatic reconcile, and it does not report that choice as `restore-failed`.
   * @param {unknown} requestId
   * @param {unknown} profileKey
   */
  async restore(requestId, profileKey) {
    if (!profileKey || profileKey !== this.base().profileKey) throw new Error('profile')
    if (typeof requestId !== 'string' || !UUID.test(requestId)) throw new Error('invalid-request')
    const viewed = await this.reconcile(requestId)
    if (viewed.reason !== 'restore-offer' && viewed.reason !== 'restore-limit') return viewed
    let operation
    try {
      operation = JSON.parse(await readFile(join(this.cacheDir, `${requestId}.json`), 'utf8'))
    } catch {
      return viewed
    }
    if (operation.requestId !== requestId) return viewed
    const installedVersion = await this.restoreMissing(operation, { manual: true })
    return { ...this.base(), ...operation, ...(installedVersion ? { installedVersion } : {}) }
  }
  dispose() {
    this.closed = true
    this.abort.abort()
  }
}
