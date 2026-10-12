// End-to-end: the packed plugin in a real DSH from npm, driven in Chromium.
//
//   node test/e2e/run.mjs                 DSH version from package.json "glassui.e2e.dsh"
//   DSH_VERSION=alpha node test/e2e/run.mjs
//   GLASSUI_E2E_KEEP=1 ...                keep the world directory for inspection
//
// Screenshots and logs land in artifacts/e2e/.
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { chromium, request } from 'playwright'
import { createWorld, installDsh, installPlugin, removeWorld, startWeb } from './lib/dsh.mjs'
import { REPLY_PREFIX, startMockLlm } from './lib/mock-llm.mjs'
import { run, stopAll } from './lib/procs.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const dshVersion = process.env.DSH_VERSION || manifest.glassui.e2e.dsh
const out = join(root, 'artifacts', 'e2e')
mkdirSync(out, { recursive: true })

const FOOTPRINT = [
  'data-glassui',
  'data-glassui-sidebar',
  'data-glassui-wallpaper',
  'data-glassui-highlights',
  'data-glassui-raw',
  'data-glassui-surface',
  'data-glassui-fill',
  'data-glassui-flat',
  'data-glassui-paint',
  'data-glassui-float',
  'data-glassui-lens',
  'data-glassui-owned',
]
  .map(name => `[${name}]`)
  .join(',')

let world
let mock
let web
let browser
let api

before(
  async () => {
    try {
      await setup()
    } catch (error) {
      // node:test reports only "cancelled" for the tests; show why.
      console.error(`# setup failed: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  },
  { timeout: 1_200_000 },
)

async function setup() {
  const log = name => join(out, `${name}.log`)
  await run('build', process.execPath, ['scripts/build.mjs'], { cwd: root, logFile: log('build') })
  await run('pack', process.execPath, ['scripts/pack.mjs'], { cwd: root, logFile: log('pack') })
  const tarball = join(root, 'artifacts', `${manifest.name}-${manifest.version}.tgz`)
  const dsh = await installDsh({
    version: dshVersion,
    dir: join(root, '.cache', 'e2e', `dsh-${dshVersion}`),
    logFile: log('install-dsh'),
  })
  console.log(`# DSH ${dsh.version}`)
  world = await createWorld()
  const profile = await installPlugin({ dsh, world, tarball, logFile: log('install-plugin') })
  assert.ok(profile.dependencies?.[manifest.name], 'the plugin is in the Web profile')
  mock = await startMockLlm()
  web = await startWeb({
    dsh,
    world,
    port: 4300 + Math.floor(Math.random() * 90),
    mockUrl: mock.url,
    logFile: log('dsh-web'),
  })
  browser = await chromium.launch({ executablePath: process.env.GLASSUI_CHROMIUM || undefined })
  // Keeps DSH's auth cookie across the token redirect.
  api = await request.newContext()
}

after(async () => {
  await api?.dispose()
  await browser?.close()
  await stopAll()
  await mock?.close()
  if (world && !process.env.GLASSUI_E2E_KEEP) await removeWorld(world)
})

/** The HTML of a fresh page render. */
async function pageHtml() {
  return (await api.get(web.url)).text()
}

/** Wait until DSH has stored the material switch, as seen by the next page render. */
async function storedEnabled(value) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const match = /"enabled":(true|false)/.exec(await pageHtml())
    if (match?.[1] === String(value)) return
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  assert.fail(`DSH did not store enabled=${value}`)
}

/** Open DSH in a fresh browser context and get past first-run screens. */
async function open(scheme = 'light') {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: scheme,
    locale: 'en-US',
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && /glassui/i.test(message.text())) errors.push(message.text())
  })
  await page.goto(web.url)
  await page.waitForFunction(() => '__DSH_GLASSUI_DEBUG__' in window, undefined, { timeout: 60_000 })
  // First-run screens (the welcome dialog) can appear a moment after load.
  const proceed = page.getByRole('button', { name: 'Continue', exact: true })
  for (let quiet = 0; quiet < 6; quiet++) {
    if (await proceed.isVisible().catch(() => false)) {
      await proceed.click()
      quiet = 0
    }
    await page.waitForTimeout(400)
  }
  return { page, errors, close: () => context.close() }
}

function diagnostics(page) {
  return page.evaluate(() => window.__DSH_GLASSUI_DEBUG__.diagnostics())
}

function kinds(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-glassui-surface]:not([data-glassui-flat])')]
      .filter(element => !element.closest('[data-glassui-owned]'))
      .map(element => element.getAttribute('data-glassui-surface')),
  )
}

async function openSettings(page) {
  await page.getByText('Settings', { exact: true }).first().click()
  await page.getByText('Glass UI', { exact: true }).first().click()
  await page.getByRole('switch', { name: 'Glass material' }).waitFor()
}

describe(`dsh-glassui on DSH ${dshVersion}`, () => {
  it('ships its boot rows in the page HTML', async () => {
    const html = await pageHtml()
    assert.ok(html.includes('/* dsh-glassui:'), 'static stylesheet')
    assert.ok(html.includes('__DSH_GLASSUI__'), 'settings global')
  })

  for (const scheme of ['light', 'dark']) {
    it(`finds DSH's surfaces in the ${scheme} palette`, async () => {
      const { page, errors, close } = await open(scheme)
      try {
        const composer = page.locator('[data-composer-input][contenteditable="true"]').first()
        await composer.click()
        await page.keyboard.type(`Show me glass nonce=${scheme}`)
        await page.keyboard.press('Enter')
        await page.getByText(`${REPLY_PREFIX} ${scheme}`).first().waitFor({ timeout: 60_000 })
        await page.waitForTimeout(800)
        const found = await kinds(page)
        for (const kind of ['sidebar', 'composer', 'backdrop']) assert.ok(found.includes(kind), `${kind} in ${found}`)
        const report = await diagnostics(page)
        assert.equal(report.running, true)
        assert.deepEqual(report.missingTokens, [])
        assert.deepEqual(report.ambiguousTokens, [])
        assert.equal(await page.getAttribute('html', 'data-glassui'), 'on')
        await page.screenshot({ path: join(out, `chat-${scheme}.png`) })
        assert.deepEqual(errors, [])
      } finally {
        await close()
      }
    })
  }

  it('adds its settings section and applies edits live', async () => {
    const { page, close } = await open()
    try {
      await openSettings(page)
      assert.ok((await kinds(page)).includes('panel'), 'the settings dialog is glass')
      await page.screenshot({ path: join(out, 'settings-light.png') })
      await page.getByRole('radio', { name: 'Docked' }).click()
      await page.waitForFunction(() => document.documentElement.getAttribute('data-glassui-sidebar') === 'docked')
      await page.getByRole('radio', { name: 'Floating' }).click()
      await page.waitForFunction(() => document.documentElement.getAttribute('data-glassui-sidebar') === 'floating')
    } finally {
      await close()
    }
  })

  it('turns off without a trace, stays off after a reload, and turns back on', async () => {
    const { page, close } = await open()
    try {
      await openSettings(page)
      const toggle = page.getByRole('switch', { name: 'Glass material' })
      await toggle.click()
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-glassui'))
      await page.waitForTimeout(800)
      assert.equal(await page.evaluate(selector => document.querySelectorAll(selector).length, FOOTPRINT), 0)
      // Saved through DSH: the next page render has no stylesheet at all.
      await storedEnabled(false)
      assert.ok(!(await pageHtml()).includes('/* dsh-glassui:'), 'no stylesheet once disabled')
      await page.reload()
      await page.waitForFunction(() => '__DSH_GLASSUI_DEBUG__' in window)
      await page.waitForTimeout(1000)
      assert.equal(await page.evaluate(selector => document.querySelectorAll(selector).length, FOOTPRINT), 0)
      await openSettings(page)
      await page.getByRole('switch', { name: 'Glass material' }).click()
      await page.waitForFunction(() => document.documentElement.getAttribute('data-glassui') === 'on')
      await storedEnabled(true)
      assert.ok((await pageHtml()).includes('/* dsh-glassui:'))
    } finally {
      await close()
    }
  })

  it('lets another plugin’s theme overrides win', async () => {
    const { page, close } = await open()
    try {
      // DSH's ThemePresenter applies ctx.theme.overrideTokens as inline values on <body>.
      await page.evaluate(() => document.body.style.setProperty('--dsw-alias-bg-layer-2', 'rgb(180 20 60)'))
      await openSettings(page)
      await page.waitForTimeout(800)
      const fills = await page.evaluate(() =>
        [...document.querySelectorAll('[data-glassui-surface="panel"]')].map(
          element => getComputedStyle(element).backgroundColor,
        ),
      )
      assert.ok(
        fills.some(fill => /rgba?\(180, 20, 60|color\(srgb 0\.70\d+ 0\.078\d+ 0\.235\d+/.test(fill)),
        `override visible through the glass: ${fills.join(' | ')}`,
      )
    } finally {
      await close()
    }
  })
})
