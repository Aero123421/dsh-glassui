// Real DSH from npm in an isolated world: its own HOME and DSH_HOME, so nothing
// touches the developer's ~/.dsh. The plugin is installed with DSH's supported
// command (`dsh plugin --profile web add <tarball>`), and every model call goes
// to the mock in ./mock-llm.mjs through DEEPSEEK_BASE_URL.
// Adapted from the dsh-remora E2E harness (MIT, same author).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { childEnv, run, start } from './procs.mjs'

export const DSH_PACKAGE = '@deepseek-ai/dsh'

/** Install (or reuse) DSH; returns its `dsh` bin script and exact version. */
export async function installDsh({ version, dir, logFile }) {
  const manifest = join(dir, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')
  const installed = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')).version : undefined
  const pinned = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version)
  if (!pinned || installed !== version) {
    await rm(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ name: 'glassui-e2e-dsh', private: true }, null, 2)}\n`)
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    await run(
      'npm install dsh',
      npm,
      ['install', '--no-audit', '--no-fund', '--save-exact', `${DSH_PACKAGE}@${version}`],
      {
        cwd: dir,
        env: childEnv(),
        logFile,
        timeoutMs: 900_000,
      },
    )
  }
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.dsh
  if (!bin) throw new Error(`${DSH_PACKAGE} has no "dsh" bin`)
  return { bin: resolve(dirname(manifest), bin), version: pkg.version }
}

/** Create the isolated world. */
export async function createWorld() {
  const root = await mkdtemp(join(tmpdir(), 'glassui-e2e-'))
  const world = {
    root,
    home: join(root, 'home'),
    dshHome: join(root, 'dsh-home'),
    agentsHome: join(root, 'agents-home'),
    work: join(root, 'work'),
    documents: join(root, 'home', 'Documents'),
    patch: join(root, 'e2e.patch.yml'),
  }
  for (const dir of [world.home, world.dshHome, world.agentsHome, world.work, world.documents])
    mkdirSync(dir, { recursive: true })
  // Linux resolves "Documents" through xdg-user-dir, which containers lack.
  writeFileSync(
    world.patch,
    ['- id: workspace-controller', '  config:', `    documentsDirectory: ${JSON.stringify(world.documents)}`, ''].join(
      '\n',
    ),
  )
  return world
}

export function removeWorld(world) {
  return rm(world.root, { recursive: true, force: true, maxRetries: 3 })
}

export function dshEnv(world, { mockUrl } = {}) {
  return childEnv({
    HOME: world.home,
    USERPROFILE: world.home,
    XDG_CONFIG_HOME: join(world.home, '.config'),
    XDG_DATA_HOME: join(world.home, '.local', 'share'),
    XDG_CACHE_HOME: join(world.home, '.cache'),
    DSH_HOME: world.dshHome,
    DSH_AGENTS_HOME: world.agentsHome,
    DSH_TELEMETRY_MODE: 'DISABLED',
    DEEPSEEK_API_KEY: 'glassui-e2e-mock-key',
    ...(mockUrl ? { DEEPSEEK_BASE_URL: mockUrl, DEEPSEEK_SEARCH_BASE_URL: mockUrl } : {}),
    BROWSER: 'none',
  })
}

/** `dsh plugin --profile web add <tarball>`; returns the Web profile manifest. */
export async function installPlugin({ dsh, world, tarball, logFile }) {
  await run('dsh plugin add', process.execPath, [dsh.bin, 'plugin', '--profile', 'web', 'add', tarball], {
    cwd: world.work,
    env: dshEnv(world),
    logFile,
    timeoutMs: 300_000,
  })
  return JSON.parse(readFileSync(join(world.dshHome, 'profiles', 'web', 'package.json'), 'utf8'))
}

/** Start DSH Web and wait for the startup line with the authenticated URL. */
export async function startWeb({ dsh, world, port, mockUrl, logFile, timeoutMs = 180_000 }) {
  const proc = start(
    'dsh web',
    process.execPath,
    [dsh.bin, 'web', '--patch', world.patch, '--no-open', '--host', '127.0.0.1', '--port', String(port)],
    { cwd: world.work, env: dshEnv(world, { mockUrl }), logFile },
  )
  const match = await proc.waitFor(/dsh web: (https?:\/\/\S+)/, timeoutMs, 'the "dsh web: <url>" startup line')
  const url = new URL(match[1])
  return { proc, url: url.href, origin: url.origin }
}
