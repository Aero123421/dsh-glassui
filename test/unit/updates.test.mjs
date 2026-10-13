import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile, mkdir, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import {
  PluginUpdates,
  REPOSITORY,
  PACKAGE,
  compareVersions,
  semanticVersion,
  releaseCandidate,
  checkCompatibility,
  resultState,
  sourceKind,
  boundedFetch,
  packageManifest,
} from '../../src/host/updates.mjs'
const version = '0.6.0',
  tag = `v${version}`
const filename = `dsh-glassui-${version}.tgz`
const download = `https://github.com/${REPOSITORY}/releases/download/${tag}/`
const release = {
  id: 7,
  tag_name: tag,
  html_url: `https://github.com/${REPOSITORY}/releases/tag/${tag}`,
  draft: false,
  prerelease: false,
  body: 'Changes',
  assets: [filename, 'SHA256SUMS'].map((name, i) => ({
    name,
    id: i + 1,
    size: 50,
    browser_download_url: download + name,
  })),
}
const pkg = {
  name: PACKAGE,
  version,
  dsh: { bundle: { patch: './cordis.patch.yml' } },
  peerDependencies: { '@deepseek-ai/dsh-llm': '0.2.1-alpha.2' },
}
function tarPackage(value = pkg) {
  const content = Buffer.from(JSON.stringify(value)),
    header = Buffer.alloc(512)
  header.write('package/package.json')
  header.write(content.length.toString(8).padStart(11, '0'), 124)
  header[156] = 48
  return gzipSync(Buffer.concat([header, content, Buffer.alloc(512 - (content.length % 512)), Buffer.alloc(1024)]))
}
const bytes = tarPackage(),
  hash = createHash('sha256').update(bytes).digest('hex')
function fetcher(input) {
  const url = String(input)
  if (url.endsWith('/releases/latest')) return Promise.resolve(Response.json(release))
  if (url.endsWith('/package.json')) return Promise.resolve(Response.json(pkg))
  if (url.endsWith('SHA256SUMS')) return Promise.resolve(new Response(`${hash}  ${filename}\n`))
  if (url.endsWith('.tgz')) return Promise.resolve(new Response(bytes))
  throw new Error(url)
}
async function fixture(t, overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'pi-update-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const calls = []
  const bundle = { name: PACKAGE, installed: true, enabled: false, version: '0.5.0', source: `github:${REPOSITORY}` }
  const manager = {
    listBundles: async () => [bundle],
    waitForInstall: async () => null,
    installBundle: async (...args) => {
      calls.push(args)
      bundle.version = version
      return {
        changed: true,
        application: 'restart-required',
        stage: 'install',
        target: PACKAGE,
        bundle: PACKAGE,
        version,
      }
    },
  }
  const updater = new PluginUpdates({
    manager: () => manager,
    profileDir: directory,
    runtimeVersion: async () => '0.2.1-alpha.2',
    fetcher,
    version: '0.5.0',
    ...overrides,
  })
  t.after(() => updater.dispose())
  return { updater, manager, bundle, calls, directory }
}
async function settle(updater) {
  while (updater.running) await new Promise(resolve => setTimeout(resolve, 5))
}

test('strict SemVer ordering, numeric prereleases, build metadata and invalid metadata', () => {
  assert.equal(compareVersions('0.10.0', '0.9.0'), 1)
  assert.equal(compareVersions('1.0.0-alpha.10', '1.0.0-alpha.2'), 1)
  assert.equal(compareVersions('1.0.0', '1.0.0-rc.1'), 1)
  assert.equal(compareVersions('1.0.0+x', '1.0.0+y'), 0)
  for (const invalid of ['01.0.0', '1.0', '1.0.0-01', '', null]) assert.throws(() => semanticVersion(invalid))
})
test('release schema, stable channel, exact assets and compatibility are fail closed', () => {
  const candidate = releaseCandidate(release, '0.5.0')
  assert.equal(releaseCandidate(release, version), null)
  assert.equal(checkCompatibility(pkg, candidate, '0.2.1-alpha.2'), '0.2.1-alpha.2')
  assert.throws(() => checkCompatibility(pkg, candidate, '0.2.1'), /incompatible/)
  assert.throws(
    () =>
      checkCompatibility({ ...pkg, peerDependencies: { '@deepseek-ai/dsh-llm': 'invalid range' } }, candidate, '0.2.1'),
    /compatibility-unknown/,
  )
  for (const value of [
    { ...release, prerelease: true },
    { ...release, draft: true },
    { ...release, assets: [...release.assets, release.assets[0]] },
    { ...release, assets: [] },
    { ...release, tag_name: 'garbage' },
  ])
    assert.throws(() => releaseCandidate(value, '0.5.0'))
  assert.deepEqual(packageManifest(bytes), pkg)
})
test('source provenance preserves Github and tarball family and refuses arbitrary local/registry', () => {
  for (const source of [`github:${REPOSITORY}#v0.5.0`, `git+https://github.com/${REPOSITORY}.git#abc`])
    assert.equal(sourceKind(source), 'github')
  assert.equal(sourceKind(download + filename), 'tarball')
  assert.equal(
    sourceKind('file:/tmp/profile/.dsh-glassui-updates/verified-a/a.tgz', '/tmp/profile/.dsh-glassui-updates'),
    'tarball',
  )
  assert.equal(sourceKind('file:/downloads/dsh-glassui-0.5.0.tgz', undefined, '0.5.0'), 'tarball')
  assert.equal(sourceKind('file:C:\\Downloads\\dsh-glassui-0.5.0.tgz', undefined, '0.5.0'), 'tarball')
  assert.throws(() => sourceKind('file:/downloads/dsh-glassui-0.4.1.tgz', undefined, '0.5.0'))
  for (const source of ['/tmp/a.tgz', 'file:/tmp/a.tgz', 'dsh-glassui', 'github:evil/repo'])
    assert.throws(() => sourceKind(source))
})
test('bounded retrieval refuses hostile redirects, streaming oversize and network failure', async () => {
  const url = `https://api.github.com/repos/${REPOSITORY}/releases/latest`
  await assert.rejects(
    boundedFetch(url, 5, {
      fetcher: async () => new Response(null, { status: 302, headers: { location: 'https://evil.example/payload' } }),
    }),
    /redirect/,
  )
  await assert.rejects(boundedFetch(url, 5, { fetcher: async () => new Response('123456') }), /size/)
  await assert.rejects(boundedFetch(url, 5, { fetcher: async () => new Response('', { status: 500 }) }), /network/)
  await assert.rejects(boundedFetch(url, 5, { signal: AbortSignal.abort(), fetcher: async () => new Response('123') }))
})
test('manager results distinguish application, failure, cancellation, override and unknown', () => {
  const result = { bundle: PACKAGE, version, application: 'applied', changed: true }
  const installed = { name: PACKAGE, version, installed: true }
  assert.equal(resultState(result, version, version, installed), 'applied')
  assert.equal(resultState(result, version, '0.5.0', installed), 'unknown')
  for (const application of ['failed', 'cancelled', 'overridden', 'restart-required'])
    assert.equal(resultState({ ...result, application }, version, version, installed), application)
  assert.equal(resultState({ ...result, packageResult: { exitCode: 0, timedOut: true } }, version, version), 'failed')
  assert.equal(resultState(null, version, version), 'unknown')
})
test('single pinned install preserves disabled selection; journal supports reconnection and runtime verification', async t => {
  const { updater, manager, calls, directory, bundle } = await fixture(t)
  const checked = await updater.check(),
    requestId = randomUUID()
  assert.equal(checked.status, 'available')
  await updater.begin(checked.candidate.id, requestId, updater.base().profileKey)
  await updater.begin(checked.candidate.id, requestId, updater.base().profileKey)
  await settle(updater)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], `github:${REPOSITORY}#${tag}`)
  assert.deepEqual(calls[0][1], { enabled: false, requestId, saveExact: true })
  assert.equal((await updater.reconcile(requestId)).status, 'restart-required')
  const restarted = new PluginUpdates({
    manager: () => manager,
    profileDir: directory,
    version,
    runtimeVersion: async () => '0.2.1-alpha.2',
  })
  bundle.version = '0.5.0'
  assert.equal((await restarted.reconcile(requestId)).status, 'unknown')
  bundle.version = version
  assert.equal((await restarted.reconcile(requestId)).status, 'applied')
})
test('missing manager/read-only/source reject before networking; login or save busy rejects begin', async t => {
  const { updater, bundle } = await fixture(t, {
    fetcher: async () => {
      throw new Error('unexpected fetch')
    },
  })
  bundle.readOnlyReason = 'management-required'
  assert.equal((await updater.check()).reason, 'read-only')
  delete bundle.readOnlyReason
  bundle.source = 'file:/tmp/untrusted.tgz'
  assert.equal((await updater.check()).reason, 'source')
  const missing = await fixture(t, { manager: () => undefined })
  assert.equal((await missing.updater.status()).reason, 'manager-unavailable')
  const busy = await fixture(t, { isBusy: () => true })
  await busy.updater.check()
  await assert.rejects(busy.updater.begin('7', randomUUID(), busy.updater.base().profileKey), /busy/)
})
test('checksum or manifest mismatch prevents manager call; tgz stages a persistent verified file', async t => {
  const bad = await fixture(t, {
    fetcher: async url =>
      String(url).endsWith('SHA256SUMS') ? new Response(`${'0'.repeat(64)}  ${filename}`) : fetcher(url),
  })
  await bad.updater.check()
  const id = randomUUID()
  await bad.updater.begin('7', id, bad.updater.base().profileKey)
  await settle(bad.updater)
  assert.equal(bad.calls.length, 0)
  assert.equal((await bad.updater.reconcile(id)).reason, 'checksum')
  const good = await fixture(t)
  good.bundle.source = download + filename
  await good.updater.check()
  await good.updater.begin('7', randomUUID(), good.updater.base().profileKey)
  await settle(good.updater)
  assert.ok(good.calls[0][0].startsWith(join(good.directory, '.dsh-glassui-updates', 'verified-')))
})
test('forgotten request is unknown, never successful or automatically resubmitted', async t => {
  const { updater, calls, directory } = await fixture(t)
  const id = randomUUID()
  await updater.privateDir()
  await writeFile(
    join(directory, '.dsh-glassui-updates', `${id}.json`),
    JSON.stringify({ requestId: id, version, status: 'installing' }),
  )
  assert.equal((await updater.reconcile(id)).status, 'unknown')
  assert.equal(calls.length, 0)
  await writeFile(
    join(directory, '.dsh-glassui-updates', `${id}.json`),
    JSON.stringify({ requestId: id, version, status: 'preparing' }),
  )
  assert.equal((await updater.reconcile(id)).status, 'failed')
})

test('verified archive with wrong package metadata is refused and disposal aborts preparation', async t => {
  const wrong = tarPackage({ ...pkg, name: 'foreign-package' })
  const wrongHash = createHash('sha256').update(wrong).digest('hex')
  const bad = await fixture(t, {
    fetcher: async url =>
      String(url).endsWith('SHA256SUMS')
        ? new Response(`${wrongHash}  ${filename}`)
        : String(url).endsWith('.tgz')
          ? new Response(wrong)
          : fetcher(url),
  })
  await bad.updater.check()
  const id = randomUUID()
  await bad.updater.begin('7', id, bad.updater.base().profileKey)
  await settle(bad.updater)
  assert.equal(bad.calls.length, 0)
  assert.equal((await bad.updater.reconcile(id)).reason, 'metadata')
  const stopped = await fixture(t)
  await stopped.updater.check()
  stopped.updater.fetcher = async (_url, { signal }) => {
    signal.throwIfAborted()
    return Response.json(release)
  }
  await stopped.updater.begin('7', randomUUID(), stopped.updater.base().profileKey)
  stopped.updater.dispose()
  await settle(stopped.updater)
  assert.equal(stopped.calls.length, 0)
})

test('post-invocation transport failure remains unknown and reconciles the original manager request', async t => {
  const { updater, manager, bundle, directory, calls } = await fixture(t)
  let waited = 0
  manager.installBundle = async (...args) => {
    calls.push(args)
    bundle.version = version
    throw new Error('response lost after manager admission')
  }
  manager.waitForInstall = async () => {
    waited++
    return {
      changed: true,
      application: 'restart-required',
      stage: 'install',
      target: PACKAGE,
      bundle: PACKAGE,
      version,
    }
  }
  await updater.check()
  const id = randomUUID()
  await updater.begin('7', id, updater.base().profileKey)
  await settle(updater)
  assert.equal((await updater.reconcile(id)).status, 'restart-required')
  assert.equal(waited, 1)
  assert.equal(calls.length, 1)
  const restarted = new PluginUpdates({
    manager: () => manager,
    profileDir: directory,
    version,
    runtimeVersion: async () => '0.2.1-alpha.2',
  })
  assert.equal((await restarted.reconcile(id)).status, 'applied')
  assert.equal(calls.length, 1)
})

test('release-named local directories and links remain manual sources', async t => {
  const { updater, bundle, directory } = await fixture(t)
  const source = join(directory, 'dsh-glassui-0.5.0.tgz')
  bundle.source = `file:${source}`
  await mkdir(source)
  assert.equal((await updater.status()).reason, 'source')
  await rm(source, { recursive: true })
  const target = join(directory, 'original.tgz')
  await writeFile(target, 'fixture')
  await symlink(target, source)
  assert.equal((await updater.status()).reason, 'source')
})

test('disposal or active login during the awaited journal save cannot start manager installation', async t => {
  for (const action of ['dispose', 'login']) {
    let busy = false,
      reached,
      release
    const waiting = new Promise(resolve => {
      reached = resolve
    })
    const gate = new Promise(resolve => {
      release = resolve
    })
    const { updater, calls } = await fixture(t, { isBusy: () => busy })
    const save = updater.save.bind(updater)
    updater.save = async (operation, claim) => {
      await save(operation, claim)
      if (operation.status === 'installing') {
        reached()
        await gate
      }
    }
    await updater.check()
    await updater.begin('7', randomUUID(), updater.base().profileKey)
    await waiting
    if (action === 'dispose') updater.dispose()
    else busy = true
    release()
    await settle(updater)
    assert.equal(calls.length, 0)
  }
})

test('Glass range admits the supported DSH prerelease and refuses unsupported runtimes', () => {
  const candidate = releaseCandidate(release, '0.5.0')
  const ranged = { ...pkg, peerDependencies: { '@deepseek-ai/dsh': '>=0.2.0-rc.2 <0.3.0' } }
  assert.equal(checkCompatibility(ranged, candidate, '0.2.1-alpha.2'), '0.2.1-alpha.2')
  assert.throws(() => checkCompatibility(ranged, candidate, '0.2.0-rc.1'), /incompatible/)
  assert.throws(() => checkCompatibility(ranged, candidate, '0.3.0'), /incompatible/)
})

test('external upgrade during final receipt save cannot be downgraded', async t => {
  const { updater, bundle, calls } = await fixture(t)
  const save = updater.save.bind(updater)
  updater.save = async (operation, claim) => {
    await save(operation, claim)
    if (operation.status === 'installing') bundle.version = '0.7.0'
  }
  await updater.check()
  const id = randomUUID()
  await updater.begin('7', id, updater.base().profileKey)
  await settle(updater)
  assert.equal(calls.length, 0)
  assert.equal((await updater.reconcile(id)).reason, 'stale-candidate')
})
test('nominal success requires actual installed version before restart instruction', async t => {
  const { updater, manager, bundle } = await fixture(t)
  manager.installBundle = async () => ({ bundle: PACKAGE, version, application: 'restart-required' })
  await updater.check()
  const id = randomUUID()
  await updater.begin('7', id, updater.base().profileKey)
  await settle(updater)
  assert.equal((await updater.reconcile(id)).status, 'unknown')
  bundle.version = version
  assert.equal((await updater.reconcile(id)).status, 'restart-required')
  bundle.error = { code: 'not-bundle' }
  assert.equal((await updater.reconcile(id)).status, 'unknown')
})
test('updating old receipt cannot take ownership of latest operation', async t => {
  const { updater } = await fixture(t)
  const first = { requestId: randomUUID(), version, status: 'failed' }
  const second = { requestId: randomUUID(), version, status: 'unknown' }
  await updater.save(first, true)
  await updater.save(second, true)
  await updater.save(first)
  assert.equal(await updater.lastOperation(), second.requestId)
})
test('cancellation outcome survives nonzero package exit', () => {
  assert.equal(
    resultState({ application: 'cancelled', packageResult: { exitCode: 130 } }, version, version),
    'cancelled',
  )
})
