// Checks that a DSH release still provides everything dsh-glassui depends on:
// the theme tokens it reads and writes, and the few platform contracts it uses
// (the boot-row event, the client module loader, the settings slot and form
// service, the palette attribute, the packages the client half injects).
//
// Usage:
//   node scripts/compat.mjs --dsh <dir>        a directory whose node_modules (or itself)
//                                              contains @deepseek-ai/dsh
//   node scripts/compat.mjs --install <spec>   install @deepseek-ai/dsh@<spec> into a
//                                              temporary directory first (e.g. alpha, 0.2.1-alpha.2)
//   add --json for a machine-readable report.
//
// Exit code 1 when a required token or contract is missing.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import semver from 'semver'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const { values: args } = parseArgs({
  options: {
    dsh: { type: 'string' },
    install: { type: 'string' },
    json: { type: 'boolean', default: false },
  },
})

if (!args.dsh && !args.install) {
  console.error('usage: node scripts/compat.mjs (--dsh <dir> | --install <version>) [--json]')
  process.exit(2)
}

let cleanup
let base = args.dsh ? resolve(args.dsh) : undefined
if (args.install) {
  base = await mkdtemp(join(tmpdir(), 'glassui-compat-'))
  cleanup = () => rm(base, { recursive: true, force: true })
  await writeFile(join(base, 'package.json'), '{"private":true}\n')
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(
    npm,
    ['install', '--no-audit', '--no-fund', '--ignore-scripts', '--omit=dev', `@deepseek-ai/dsh@${args.install}`],
    { cwd: base, stdio: args.json ? 'ignore' : 'inherit', shell: process.platform === 'win32' },
  )
  if (result.status !== 0) {
    await cleanup()
    console.error(`npm install @deepseek-ai/dsh@${args.install} failed`)
    process.exit(2)
  }
}

/** Find the @deepseek-ai scope directory under the given base. */
function scopeDir(start) {
  for (const candidate of [join(start, 'node_modules', '@deepseek-ai'), join(start, '@deepseek-ai'), start]) {
    if (existsSync(join(candidate, 'dsh', 'package.json'))) return candidate
  }
  return undefined
}

const scope = scopeDir(base)
if (!scope) {
  console.error(`no @deepseek-ai/dsh under ${base}`)
  await cleanup?.()
  process.exit(2)
}
const dshVersion = JSON.parse(await readFile(join(scope, 'dsh', 'package.json'), 'utf8')).version

// ---------------------------------------------------------------- what we need

const tokens = await import(pathToFileURL(join(root, 'src/shared/tokens.ts')).href)
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const settingsCss = await readFile(join(root, 'src/client/settings/styles.css'), 'utf8')

/** @type {Map<string, { required: boolean, source: string }>} */
const neededTokens = new Map()
for (const name of tokens.ALL_UPSTREAM_TOKENS) neededTokens.set(name, { required: true, source: 'engine' })
for (const match of settingsCss.matchAll(/var\((--dsw-[\w-]+)\s*(,)?/g)) {
  const name = match[1]
  const withFallback = match[2] === ','
  const existing = neededTokens.get(name)
  if (existing?.required) continue
  neededTokens.set(name, { required: !withFallback && existing?.required !== false, source: 'settings page' })
}

const contracts = [
  {
    name: 'Host event "webserver/index-inject" (boot rows)',
    packages: ['dsh-host-webserver'],
    needle: 'webserver/index-inject',
    required: true,
  },
  { name: 'Client module loader window.__ModuleLoader__', packages: '*', needle: '__ModuleLoader__', required: true },
  {
    name: 'Settings slot "settings.section"',
    packages: ['dsh-client-ui-settings'],
    needle: 'settings.section',
    required: true,
  },
  { name: 'Settings form service "configForms"', packages: '*', needle: 'configForms', required: true },
  {
    name: `Palette attribute ${tokens.DARK_ATTRIBUTE}`,
    packages: ['dsh-client-ui-theme'],
    needle: tokens.DARK_ATTRIBUTE,
    required: true,
  },
  {
    name: `Desktop platform attribute ${tokens.PLATFORM_ATTRIBUTE}`,
    packages: '*',
    needle: tokens.PLATFORM_ATTRIBUTE,
    required: false,
  },
  {
    name: `Markdown hint ${tokens.MARKDOWN_HINT_ATTRIBUTE} (performance only)`,
    packages: '*',
    needle: tokens.MARKDOWN_HINT_ATTRIBUTE,
    required: false,
  },
]

// ---------------------------------------------------------------- what DSH has

const TEXT_FILE = /\.(?:js|mjs|cjs|css|d\.ts)$/
const MAX_FILE = 16 * 1024 * 1024

async function* files(directory) {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) yield* files(path)
    else if (entry.isFile() && TEXT_FILE.test(entry.name)) yield path
  }
}

const packages = (await readdir(scope, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
const defined = new Set()
const found = new Map(contracts.map(contract => [contract.name, []]))
const DEFINITION = /(--dsw-[\w-]+)\s*:/g

for (const name of packages) {
  for await (const path of files(join(scope, name))) {
    if ((await stat(path)).size > MAX_FILE) continue
    const text = await readFile(path, 'utf8')
    if (text.includes('--dsw-')) for (const match of text.matchAll(DEFINITION)) defined.add(match[1])
    for (const contract of contracts) {
      if (contract.packages !== '*' && !contract.packages.includes(name)) continue
      if (text.includes(contract.needle)) found.get(contract.name).push(name)
    }
  }
}

// ---------------------------------------------------------------- report

let runtimeVersion = dshVersion
const bootManifest = join(scope, 'dsh-app-boot', 'package.json')
if (existsSync(bootManifest)) runtimeVersion = JSON.parse(await readFile(bootManifest, 'utf8')).version

const peers = []
for (const [name, range] of Object.entries(manifest.peerDependencies ?? {})) {
  if (name !== '@deepseek-ai/dsh' && !name.startsWith('@deepseek-ai/dsh-')) continue
  const ok =
    typeof range === 'string' &&
    Boolean(semver.validRange(range)) &&
    semver.satisfies(runtimeVersion, range, { includePrerelease: true })
  peers.push({ name, range, runtime: runtimeVersion, required: true, ok })
}
if (peers.length === 0)
  peers.push({ name: '@deepseek-ai/dsh', range: '', runtime: runtimeVersion, required: true, ok: false })

const report = {
  dsh: dshVersion,
  runtime: runtimeVersion,
  plugin: manifest.version,
  tokens: [],
  contracts: [],
  injects: [],
  peers,
}
for (const [name, need] of [...neededTokens].sort(([a], [b]) => a.localeCompare(b))) {
  report.tokens.push({ name, required: need.required, source: need.source, ok: defined.has(name) })
}
for (const contract of contracts) {
  const where = [...new Set(found.get(contract.name))]
  report.contracts.push({ name: contract.name, required: contract.required, ok: where.length > 0, where })
}
for (const id of manifest.dsh.client.inject) {
  const name = id.replace(/^@deepseek-ai\//, '')
  report.injects.push({ name: id, required: true, ok: packages.includes(name) })
}

const failures = [...report.tokens, ...report.contracts, ...report.injects, ...report.peers].filter(
  item => item.required && !item.ok,
)
const warnings = [...report.tokens, ...report.contracts].filter(item => !item.required && !item.ok)

if (args.json) {
  console.log(JSON.stringify({ ...report, ok: failures.length === 0 }, null, 2))
} else {
  const mark = item => (item.ok ? 'ok  ' : item.required ? 'MISS' : 'warn')
  console.log(
    `dsh-glassui ${report.plugin} against @deepseek-ai/dsh ${report.dsh}` +
      (report.runtime === report.dsh ? '' : ` (runtime ${report.runtime})`) +
      '\n',
  )
  console.log(`Tokens (${report.tokens.filter(item => item.ok).length}/${report.tokens.length} defined)`)
  for (const item of report.tokens) if (!item.ok) console.log(`  ${mark(item)} ${item.name}  (${item.source})`)
  console.log('\nContracts')
  for (const item of report.contracts)
    console.log(`  ${mark(item)} ${item.name}${item.ok ? `  [${item.where.slice(0, 3).join(', ')}]` : ''}`)
  console.log('\nInjected client packages')
  for (const item of report.injects) console.log(`  ${mark(item)} ${item.name}`)
  console.log('\nDSH peer range (prereleases included, same rule as boot)')
  for (const item of report.peers)
    console.log(`  ${mark(item)} ${item.name} ${item.range || '(missing)'}  admits ${item.runtime}`)
  console.log(
    failures.length === 0
      ? `\nCompatible${warnings.length > 0 ? ` (${warnings.length} optional item(s) missing)` : ''}.`
      : `\n${failures.length} required item(s) missing.`,
  )
}

await cleanup?.()
process.exit(failures.length === 0 ? 0 : 1)
