import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { localeFixture } from '../e2e/lib/locale.mjs'

for (const nativeJapanese of [false, true]) {
  test(`locale fixture preserves native Japanese: ${nativeJapanese}`, async () => {
    const root = await mkdtemp(join(tmpdir(), 'glassui-locale-test-'))
    try {
      const directory = await localeFixture({ root })
      const code = await readFile(join(directory, 'client.js'), 'utf8')
      const catalog = new Map([['en', { id: 'en' }], ...(nativeJapanese ? [['ja', { id: 'ja' }]] : [])])
      const original = catalog.get('ja')
      const disposers = []
      let additions = 0
      let styleRemoved = false
      const window = {
        __ModuleLoader__: {
          load({ factory }) {
            factory().apply({
              effect(setup) {
                disposers.push(setup())
              },
              locale: {
                getSnapshot: () => ({ locales: [...catalog.values()] }),
                addLanguage(language) {
                  assert.equal(catalog.has(language.id), false, 'must not duplicate an existing language')
                  additions++
                  catalog.set(language.id, language)
                  return () => catalog.delete(language.id)
                },
              },
            })
          },
        },
      }
      runInNewContext(code, {
        window,
        document: {
          createElement: () => ({
            dataset: {},
            remove() {
              styleRemoved = true
            },
          }),
          head: { append() {} },
        },
      })
      assert.equal(catalog.has('ja'), true)
      assert.equal(additions, nativeJapanese ? 0 : 1)
      for (const dispose of disposers.reverse()) dispose()
      assert.equal(catalog.get('ja'), original, 'disposal preserves the host language')
      assert.equal(styleRemoved, true)
      assert.equal(window.__GLASSUI_TEST_LOCALE__, undefined)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
}
