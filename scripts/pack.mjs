// Packs the built plugin for GitHub Releases: artifacts/dsh-glassui-<version>.tgz
// plus SHA256SUMS. The packed package.json drops scripts, devDependencies and the
// repository's own tooling settings, so installing the tarball never runs code and
// never resolves a dev-only package.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const artifacts = resolve(root, 'artifacts')
const stage = resolve(artifacts, 'stage')
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))

for (const file of ['dist/index.js', 'dist/client.js']) {
  await access(resolve(root, file)).catch(() => {
    throw new Error(`${file} is missing: run \`npm run build\` first`)
  })
}

await rm(stage, { recursive: true, force: true })
await mkdir(stage, { recursive: true })
for (const entry of manifest.files) await cp(resolve(root, entry), resolve(stage, entry), { recursive: true })

const published = { ...manifest }
delete published.scripts
delete published.devDependencies
delete published.glassui
if (published.dependencies && Object.keys(published.dependencies).length > 0) {
  throw new Error('the plugin must not have runtime dependencies')
}
await writeFile(resolve(stage, 'package.json'), `${JSON.stringify(published, null, 2)}\n`)

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npm, ['pack', '--pack-destination', artifacts], {
  cwd: stage,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
if (result.status !== 0) process.exit(result.status ?? 1)
await rm(stage, { recursive: true, force: true })

const filename = `${manifest.name}-${manifest.version}.tgz`
const hash = createHash('sha256')
  .update(await readFile(resolve(artifacts, filename)))
  .digest('hex')
await writeFile(resolve(artifacts, 'SHA256SUMS'), `${hash}  ${filename}\n`)
console.log(`${filename}  sha256 ${hash}`)
