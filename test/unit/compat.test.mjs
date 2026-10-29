import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { ALL_UPSTREAM_TOKENS } from '../../src/shared/tokens.ts'

const retired = '--dsw-specific-sidebar-nav-item-hover'

// Exercise the CLI against a minimal installed-package tree, without fetching npm.
async function check({ missing = [] } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'glassui-compat-test-'))
  try {
    const scope = join(directory, 'node_modules', '@deepseek-ai')
    const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'))
    const css = await readFile(new URL('../../src/client/settings/styles.css', import.meta.url), 'utf8')
    const names = new Set(
      [...ALL_UPSTREAM_TOKENS, ...css.matchAll(/var\((--dsw-[\w-]+)/g)].map(value =>
        typeof value === 'string' ? value : value[1],
      ),
    )
    const sources = {
      ...Object.fromEntries(manifest.dsh.client.inject.map(name => [name.replace('@deepseek-ai/', ''), ''])),
      'dsh-host-webserver': 'webserver/index-inject',
      'dsh-client-ui-settings': 'settings.section configForms',
      'dsh-client-ui-theme': `data-ds-dark-theme data-platform data-markdown-variant __ModuleLoader__\n${[...names]
        .filter(name => !missing.includes(name))
        .map(name => `${name}: #ffffff;`)
        .join('\n')}`,
    }
    for (const name of ['dsh', ...Object.keys(sources)]) {
      const path = join(scope, name)
      await mkdir(path, { recursive: true })
      await writeFile(join(path, 'package.json'), JSON.stringify({ version: '0.2.2-alpha.2' }))
      if (sources[name]) await writeFile(join(path, 'index.js'), sources[name])
    }
    const result = spawnSync(process.execPath, ['scripts/compat.mjs', '--dsh', directory, '--json'], {
      cwd: new URL('../..', import.meta.url),
      encoding: 'utf8',
    })
    assert.equal(result.error, undefined)
    return { status: result.status, report: JSON.parse(result.stdout) }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('compat accepts the retired sidebar hover token on older DSH', async () => {
  const { status, report } = await check()
  assert.equal(status, 0)
  assert.equal(report.ok, true)
  assert.equal(report.tokens.find(token => token.name === retired).ok, true)
})

test('compat warns for the retired sidebar hover token removed in DSH 0.2.2-alpha.2', async () => {
  const { status, report } = await check({ missing: [retired] })
  assert.equal(status, 0)
  assert.equal(report.ok, true)
  assert.deepEqual(
    report.tokens.filter(token => !token.ok).map(({ name, required }) => ({ name, required })),
    [{ name: retired, required: false }],
  )
})

test('compat still rejects a missing composer fill', async () => {
  const { status, report } = await check({ missing: [retired, '--dsw-specific-input-major'] })
  assert.equal(status, 1)
  assert.equal(report.ok, false)
  assert.equal(report.tokens.find(token => token.name === '--dsw-specific-input-major').required, true)
})
