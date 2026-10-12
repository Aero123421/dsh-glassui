// Checks that a release tag matches package.json and reports the version.
//   node scripts/check-version.mjs --tag v0.1.0
// In GitHub Actions it also writes `version` and `prerelease` to $GITHUB_OUTPUT.
import { appendFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { values } = parseArgs({ options: { tag: { type: 'string' } } })
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`package.json version ${version} is not a semantic version`)
  process.exit(1)
}
if (values.tag !== undefined && values.tag !== `v${version}`) {
  console.error(`tag ${values.tag} does not match package.json version ${version} (expected v${version})`)
  process.exit(1)
}
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8')
if (!changelog.includes(`## [${version}]`)) {
  console.error(`CHANGELOG.md has no section for ${version}`)
  process.exit(1)
}
const prerelease = version.includes('-')
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\nprerelease=${prerelease}\n`)
console.log(`version ${version}${prerelease ? ' (prerelease)' : ''}`)
