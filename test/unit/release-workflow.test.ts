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
    assert.match(script, /gh release list --repo "\$repo" --limit 1000 --json tagName,isDraft/)
    assert.doesNotMatch(script, /not found/i)
  })

  it('puts the same known issues in the changelog and the release notes', () => {
    const changelog = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8')
    const section = changelog.slice(changelog.indexOf('## [0.2.6]'), changelog.indexOf('## [0.2.5]'))
    const sentences = [
      'light・黒の入力欄では High のコントラストが 1.50 で、3 未満です。dark・白・透明度 0 では `#c8ccd4` が 4.5 未満になりえます。DSH 本体の配色と glassui の塗りの組み合わせで起きます。',
      'pnpm 12 でプラグインを追加・更新すると、プロファイルの lockfile に公開から24時間たっていない依存が含まれている場合、`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` で失敗することがあります。このとき pnpm がプロファイルの `node_modules` を空にし、DSH も元に戻さないため、**同じプロファイルのすべてのプラグインが読み込まれなくなります**。このプラグイン自体の不具合ではなく、どのプラグインを操作しても起こりえます。',
      'プラグインの追加・更新は pnpm 10 で行ってください。',
      '壊れたときは、pnpm 10 で `dsh plugin --profile web install` を実行すると元に戻ります。',
      'pnpm 11 では `ERR_PNPM_UNEXPECTED_STORE` で止まりますが、`node_modules` は壊れません。',
    ]
    for (const sentence of sentences) {
      assert.ok(section.includes(sentence), sentence.slice(0, 40))
      assert.ok(workflow.includes(sentence), sentence.slice(0, 40))
    }
    assert.doesNotMatch(section, /この日以降/)
    assert.doesNotMatch(workflow, /この日以降/)
    assert.match(workflow, /section\.search\(\/\^### 既知の問題\/m\)/)
  })

  it('creates a missing release as a draft', () => {
    const result = publish({ state: 'absent' })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.calls, /release create v0\.2\.6 release\/dsh-glassui-0\.2\.6\.tgz release\/SHA256SUMS --draft /)
    assert.doesNotMatch(result.calls, /release upload/)
    assert.doesNotMatch(result.calls, /--prerelease/)
  })

  it('keeps a prerelease draft when the release is new', () => {
    const result = publish({ state: 'absent', prerelease: true })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.calls, /release create \S+ \S+ \S+ --draft /)
    assert.match(result.calls, /--prerelease/)
  })

  it('uploads only when the draft has neither asset', () => {
    const result = publish({ state: 'draft', assets: [] })
    assert.equal(result.status, 0, result.stderr)
    assert.match(
      result.calls,
      /release upload v0\.2\.6 release\/dsh-glassui-0\.2\.6\.tgz release\/SHA256SUMS --repo Aero123421\/dsh-glassui\n/,
    )
    assert.doesNotMatch(result.calls, /release create/)
    assert.doesNotMatch(result.calls, /--draft/)
  })

  it('fails and leaves an existing tarball on a draft in place', () => {
    const result = publish({ state: 'draft', assets: ['dsh-glassui-0.2.6.tgz'] })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /already has dsh-glassui-0\.2\.6\.tgz/)
    assert.doesNotMatch(result.calls, /release upload/)
    assert.doesNotMatch(result.calls, /release create/)
  })

  it('fails and leaves an existing SHA256SUMS on a draft in place', () => {
    const result = publish({ state: 'draft', assets: ['SHA256SUMS'] })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /already has SHA256SUMS/)
    assert.doesNotMatch(result.calls, /release upload/)
  })

  it('stops before changing a published release, including its assets', () => {
    for (const state of ['published', 'missing-draft-field'] as const) {
      const result = publish({ state, assets: [] })
      assert.equal(result.status, 1, `${state}: ${result.stderr}`)
      assert.match(result.stderr, /already published/)
      assert.match(result.calls, /release list --repo Aero123421\/dsh-glassui --limit 1000 --json tagName,isDraft/)
      assert.doesNotMatch(result.calls, /release upload/)
      assert.doesNotMatch(result.calls, /release create/)
      assert.doesNotMatch(result.calls, /release view/)
      assert.doesNotMatch(result.calls, /release edit/)
    }
  })

  it('creates a draft when the list is empty even if stderr says the release is missing', () => {
    const result = publish({ state: 'absent' })
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.calls, /release list /)
    assert.match(result.calls, /release create /)
    assert.match(result.stderr, /release not found/)
  })
})

function publish(input: {
  state: 'absent' | 'draft' | 'published' | 'missing-draft-field'
  assets?: string[]
  prerelease?: boolean
}): {
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
process.stderr.write('release not found\\n')
const command = args.slice(0, 2).join(' ')
if (command === 'release list') {
  const state = process.env.GH_FAKE_STATE
  const tag = 'v0.2.6'
  let list = []
  if (state === 'draft') list = [{ tagName: tag, isDraft: true }]
  else if (state === 'published') list = [{ tagName: tag, isDraft: false }]
  else if (state === 'missing-draft-field') list = [{ tagName: tag }]
  process.stdout.write(JSON.stringify(list))
  process.exit(0)
}
if (command === 'release view') {
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
      GH_FAKE_STATE: input.state,
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
