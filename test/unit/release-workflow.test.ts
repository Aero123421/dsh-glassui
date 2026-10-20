import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const workflow = readFileSync(new URL('../../.github/workflows/release.yml', import.meta.url), 'utf8')
const script = readFileSync(new URL('../../scripts/publish-release.sh', import.meta.url), 'utf8')

describe('release workflow', () => {
  it('creates a draft and does not edit or overwrite an existing release', () => {
    const step = workflow.slice(workflow.indexOf('- name: Publish'))
    assert.ok(step.startsWith('- name: Publish'))
    assert.match(step, /bash scripts\/publish-release\.sh/)
    for (const source of [workflow, script]) {
      assert.doesNotMatch(source, /--clobber/)
      assert.doesNotMatch(source, /gh release edit/)
      assert.doesNotMatch(source, /release edit/)
      assert.doesNotMatch(source, /--draft=false/)
      assert.doesNotMatch(source, /--latest\b/)
      assert.doesNotMatch(source, /--notes(?!-file)\b/)
    }
    assert.match(script, /--draft/)
    assert.match(script, /exit 1/)
  })

  it('creates a missing release as a draft', () => {
    const result = publish({ exists: false })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.calls, /release create v0\.2\.6 release\/dsh-glassui-0\.2\.6\.tgz release\/SHA256SUMS --draft /)
    assert.doesNotMatch(result.calls, /release upload/)
    assert.doesNotMatch(result.calls, /--prerelease/)
  })

  it('keeps a prerelease draft when the release is new', () => {
    const result = publish({ exists: false, prerelease: true })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.calls, /release create \S+ \S+ \S+ --draft /)
    assert.match(result.calls, /--prerelease/)
  })

  it('uploads only when the release has neither asset', () => {
    const result = publish({ exists: true, assets: [] })
    assert.equal(result.status, 0, result.stderr)
    assert.match(
      result.calls,
      /release upload v0\.2\.6 release\/dsh-glassui-0\.2\.6\.tgz release\/SHA256SUMS --repo Aero123421\/dsh-glassui\n/,
    )
    assert.doesNotMatch(result.calls, /release create/)
    assert.doesNotMatch(result.calls, /--draft/)
  })

  it('fails and leaves an existing tarball in place', () => {
    const result = publish({ exists: true, assets: ['dsh-glassui-0.2.6.tgz'] })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /already has dsh-glassui-0\.2\.6\.tgz/)
    assert.doesNotMatch(result.calls, /release upload/)
    assert.doesNotMatch(result.calls, /release create/)
  })

  it('fails and leaves an existing SHA256SUMS in place', () => {
    const result = publish({ exists: true, assets: ['SHA256SUMS'] })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /already has SHA256SUMS/)
    assert.doesNotMatch(result.calls, /release upload/)
  })
})

function publish(input: { exists: boolean; assets?: string[]; prerelease?: boolean }): {
  status: number | null
  calls: string
  stderr: string
} {
  const dir = mkdtempSync(join(tmpdir(), 'glassui-gh-'))
  const log = join(dir, 'calls')
  const gh = join(dir, 'gh')
  writeFileSync(
    gh,
    `#!/usr/bin/env node
const { appendFileSync } = require('node:fs')
const args = process.argv.slice(2)
appendFileSync(process.env.GH_FAKE_LOG, args.join(' ') + '\\n')
const command = args.slice(0, 2).join(' ')
if (command === 'release view') {
  if (process.env.GH_FAKE_EXISTS !== '1') process.exit(1)
  if (args.includes('--json')) {
    const names = (process.env.GH_FAKE_ASSETS || '').split(',').filter(Boolean)
    if (names.length) process.stdout.write(names.join('\\n') + '\\n')
  }
  process.exit(0)
}
if (command === 'release upload' || command === 'release create') process.exit(0)
process.exit(1)
`,
  )
  chmodSync(gh, 0o755)
  const result = spawnSync('bash', ['scripts/publish-release.sh'], {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH ?? ''}`,
      GH_FAKE_LOG: log,
      GH_FAKE_EXISTS: input.exists ? '1' : '0',
      GH_FAKE_ASSETS: (input.assets ?? []).join(','),
      VERSION: '0.2.6',
      GITHUB_REPOSITORY: 'Aero123421/dsh-glassui',
      PRERELEASE: input.prerelease ? 'true' : 'false',
    },
    encoding: 'utf8',
  })
  return {
    status: result.status,
    calls: readFileSync(log, 'utf8'),
    stderr: result.stderr,
  }
}
