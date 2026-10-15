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
import { localeFixture } from './lib/locale.mjs'
import { REPLY_PREFIX, startMockLlm } from './lib/mock-llm.mjs'
import { run, stopAll } from './lib/procs.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const dshVersion = process.env.DSH_VERSION || manifest.glassui.e2e.dsh
const out = process.env.GLASSUI_E2E_ARTIFACT_DIR || join(root, 'artifacts', 'e2e')
mkdirSync(out, { recursive: true })

const FOOTPRINT = [
  'data-glassui',
  'data-glassui-sidebar',
  'data-glassui-wallpaper',
  'data-glassui-static-wallpaper',
  'data-glassui-highlights',
  'data-glassui-raw',
  'data-glassui-surface',
  'data-glassui-fill',
  'data-glassui-flat',
  'data-glassui-paint',
  'data-glassui-float',
  'data-glassui-lens',
  'data-glassui-excluded',
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
  const externalSource = process.env.GLASSUI_E2E_PLUGIN_SOURCE
  if (!externalSource) {
    await run('build', process.execPath, ['scripts/build.mjs'], { cwd: root, logFile: log('build') })
    await run('pack', process.execPath, ['scripts/pack.mjs'], { cwd: root, logFile: log('pack') })
  }
  const tarball = externalSource || join(root, 'artifacts', `${manifest.name}-${manifest.version}.tgz`)
  const dsh = await installDsh({
    version: dshVersion,
    dir: join(root, '.cache', 'e2e', `dsh-${dshVersion}`),
    logFile: log('install-dsh'),
  })
  console.log(`# DSH ${dsh.version}`)
  world = await createWorld()
  const profile = await installPlugin({ dsh, world, tarball, logFile: log('install-plugin') })
  assert.ok(profile.dependencies?.[manifest.name], 'the plugin is in the Web profile')
  await installPlugin({ dsh, world, tarball: await localeFixture(world), logFile: log('install-locale-fixture') })
  mock = await startMockLlm()
  web = await startWeb({
    dsh,
    world,
    port: 0,
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

/** Wait for the Host's next boot rows to include a saved field. */
async function storedSetting(field, value) {
  const expected = JSON.stringify(field) + ':' + JSON.stringify(value)
  for (let attempt = 0; attempt < 40; attempt++) {
    if ((await pageHtml()).includes(expected)) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  assert.fail(`DSH did not store ${expected}`)
}

/** Open DSH in a fresh browser context and get past first-run screens. */
async function open(scheme = 'light', contextOptions = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: scheme,
    locale: 'en-US',
    ...contextOptions,
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
  // 0.2.1-alpha.2 and earlier put a Settings button in the sidebar foot.
  // 0.2.1-alpha.3 replaces that launcher with the account menu (visible label
  // More, accessible name Account menu). Settings is a menuitem inside it.
  const direct = page.getByRole('button', { name: 'Settings', exact: true })
  if (await direct.isVisible().catch(() => false)) {
    await direct.click()
  } else {
    await page.getByRole('button', { name: 'Account menu', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Settings', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Glass UI', exact: true }).click()
  await page.getByRole('switch', { name: 'Glass material' }).waitFor()
}

/** Drive the native range control with trusted keyboard events. */
async function setRange(slider, value) {
  await slider.focus()
  await slider.press(value <= 50 ? 'Home' : 'End')
  const count = value <= 50 ? value : 100 - value
  for (let i = 0; i < count; i++) await slider.press(value <= 50 ? 'ArrowRight' : 'ArrowLeft')
  assert.equal(Number(await slider.inputValue()), value)
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
        for (const kind of ['sidebar', 'composer', 'code', 'backdrop']) {
          assert.ok(found.includes(kind), `${kind} in ${found}`)
        }
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

  it('keeps glass throughout a sidebar boundary drag', async () => {
    const { page, errors, close } = await open()
    try {
      const handle = page.locator('[data-side="sidebar"]')
      const box = await handle.boundingBox()
      assert.ok(box, 'DSH exposes its sidebar resize handle')
      const before = await page.evaluate(() => {
        const targets = ['sidebar', 'composer'].map(kind =>
          [...document.querySelectorAll(`[data-glassui-surface="${kind}"]:not([data-glassui-flat])`)].find(
            element => !element.closest('[data-glassui-owned]'),
          ),
        )
        if (targets.some(element => !element)) throw new Error('sidebar or composer glass was not found')
        const state = { targets, frames: 0, missing: 0, frame: 0 }
        window.__glassuiResizeWatch = state
        const sample = () => {
          state.frames++
          if (
            targets.some(
              element =>
                !element.hasAttribute('data-glassui-surface') || getComputedStyle(element).backdropFilter === 'none',
            )
          )
            state.missing++
          state.frame = requestAnimationFrame(sample)
        }
        state.frame = requestAnimationFrame(sample)
        return targets[0].getBoundingClientRect().width
      })
      const x = box.x + box.width / 2
      const y = box.y + box.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      for (let step = 1; step <= 25; step++) await page.mouse.move(x + step * 4, y)
      await page.mouse.up()
      await page.waitForTimeout(400)
      const result = await page.evaluate(() => {
        const state = window.__glassuiResizeWatch
        cancelAnimationFrame(state.frame)
        delete window.__glassuiResizeWatch
        return { frames: state.frames, missing: state.missing, width: state.targets[0].getBoundingClientRect().width }
      })
      assert.ok(result.width > before, 'the drag changed the sidebar width')
      assert.ok(result.frames > 0, 'sampled rendered frames during the drag')
      assert.equal(result.missing, 0, 'glass and blur never disappear between resize updates')
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

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

  it('previews independent inline-code opacity, saves it and translates wallpaper choices', async () => {
    const { page, errors, close } = await open()
    try {
      await openSettings(page)
      const opacity = page.getByRole('slider', { name: 'Inline-code opacity', exact: true })
      await setRange(opacity, 23)
      await page.waitForFunction(() => window.__DSH_GLASSUI_DEBUG__.settings().inlineCodeOpacity === 23)
      const color = await page
        .locator('.glassui-inline-preview code')
        .first()
        .evaluate(el => getComputedStyle(el).backgroundColor)
      assert.equal(color, 'rgba(245, 246, 248, 0.23)')
      await setRange(page.getByRole('slider', { name: 'Transparency', exact: true }), 88)
      assert.equal(
        await page
          .locator('.glassui-inline-preview code')
          .first()
          .evaluate(el => getComputedStyle(el).backgroundColor),
        color,
      )
      await opacity.focus()
      await page.keyboard.press('End')
      await page.waitForFunction(() => window.__DSH_GLASSUI_DEBUG__.settings().inlineCodeOpacity === 100)
      await page.keyboard.press('Home')
      await page.waitForFunction(() => window.__DSH_GLASSUI_DEBUG__.settings().inlineCodeOpacity === 0)
      await setRange(opacity, 72)
      await page.evaluate(() => window.__GLASSUI_TEST_LOCALE__.set('ja'))
      await page.getByRole('slider', { name: 'インラインコードの不透明度', exact: true }).waitFor()
      await page.getByRole('radio', { name: '自動', exact: true }).waitFor()
      await page.setViewportSize({ width: 820, height: 1180 })
      await page.locator('.glassui-inline-preview').scrollIntoViewIfNeeded()
      await page.screenshot({ path: join(out, 'inline-ja-tablet.png') })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.locator('.glassui-inline-preview').scrollIntoViewIfNeeded()
      await page.screenshot({ path: join(out, 'inline-ja-phone.png') })
      assert.equal(await page.locator('.glassui-page').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true)
      for (let attempt = 0; attempt < 30 && !(await pageHtml()).includes('"inlineCodeOpacity":72'); attempt++)
        await page.waitForTimeout(200)
      assert.ok((await pageHtml()).includes('"inlineCodeOpacity":72'))
      await page.evaluate(() => window.__GLASSUI_TEST_LOCALE__.set('en'))
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.reload()
      await page.waitForFunction(() => '__DSH_GLASSUI_DEBUG__' in window)
      await page.getByText('Default workspace', { exact: true }).first().waitFor()
      await page.locator('[data-composer-input][contenteditable="true"]').first().waitFor()
      await openSettings(page)
      assert.equal(await page.getByRole('slider', { name: 'Inline-code opacity', exact: true }).inputValue(), '72')
      await page.evaluate(() => window.__GLASSUI_TEST_LOCALE__.set('en'))
      await setRange(page.getByRole('slider', { name: 'Transparency', exact: true }), 35)
      await storedSetting('tint', 35)
      assert.deepEqual(errors, [])
    } finally {
      await page.evaluate(() => window.__GLASSUI_TEST_LOCALE__.set('en'))
      await close()
    }
  })

  it('keeps touch sliders and refraction eligibility working at tablet DPR through rotation', async () => {
    const { page, errors, close } = await open('light', {
      deviceScaleFactor: 2,
      hasTouch: true,
    })
    try {
      await openSettings(page)
      assert.equal(await page.evaluate(() => devicePixelRatio), 2)
      const supported = (await diagnostics(page)).environment.refraction
      for (const viewport of [
        { width: 820, height: 1180 },
        { width: 1180, height: 820 },
        { width: 820, height: 1180 },
      ]) {
        await page.setViewportSize(viewport)
        const opacity = page.getByRole('slider', { name: 'Inline-code opacity', exact: true })
        await opacity.scrollIntoViewIfNeeded()
        const box = await opacity.boundingBox()
        assert.ok(box)
        await page.touchscreen.tap(box.x + box.width * 0.6, box.y + box.height / 2)
        const value = Number(await opacity.inputValue())
        assert.ok(value > 0 && value < 100)
        assert.equal(await page.evaluate(() => window.__DSH_GLASSUI_DEBUG__.settings().inlineCodeOpacity), value)
        assert.equal((await diagnostics(page)).environment.refraction, supported)
        assert.equal(await page.locator('.glassui-page').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true)
      }
      await setRange(page.getByRole('slider', { name: 'Inline-code opacity', exact: true }), 72)
      await storedSetting('inlineCodeOpacity', 72)
      await page.screenshot({ path: join(out, 'inline-touch-dpr2.png') })
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('updates independently, flushes slider saves and keeps Japanese text readable with glass off', async () => {
    const { page, errors, close } = await open()
    try {
      await openSettings(page)
      assert.equal(await page.getByRole('heading', { name: 'Glass UI plugin', exact: true }).count(), 1)
      const anonymous = await request.newContext()
      try {
        assert.equal(
          (
            await anonymous.post(web.origin + '/api/dsh-glassui/update-check', {
              data: { type: 'client-request', method: 'dsh-glassui/update-check', rpcId: 'unauthorized', payload: {} },
            })
          ).status(),
          401,
        )
      } finally {
        await anonymous.dispose()
      }

      const response = page.waitForResponse(response => response.url().endsWith('/api/dsh-glassui/update-check'))
      await page.getByRole('button', { name: 'Check plugin update', exact: true }).click()
      const updateStatus = (await (await response).json()).result.value
      // rc.2 listBundles omits source; automatic source selection must remain blocked.
      if (dshVersion === '0.2.0-rc.2') {
        assert.equal(updateStatus.status, 'blocked')
        assert.equal(updateStatus.reason, 'source')
        await page
          .getByText('This installation source requires a manual update. Its version pin will be preserved.', {
            exact: true,
          })
          .waitFor()
      } else if (process.env.GLASSUI_E2E_EXPECT_RELEASE_NETWORK_ERROR === '1') {
        assert.equal(updateStatus.status, 'blocked')
        assert.equal(updateStatus.reason, 'network', JSON.stringify(updateStatus))
        await page.getByText('Could not contact the release service. Try again later.', { exact: true }).waitFor()
        console.log(
          '# Live GitHub release API unavailable: verified bounded network failure; update interactions below use the explicit wire fixture.',
        )
      } else {
        assert.equal(updateStatus.status, 'current', JSON.stringify(updateStatus))
        await page.getByText('No newer stable release.', { exact: true }).waitFor()
      }
      let begins = 0,
        submitted
      await page.route('**/api/dsh-glassui/update-check', async route => {
        await route.fulfill({
          json: {
            type: 'server-response',
            rpcId: route.request().postDataJSON().rpcId,
            result: {
              ok: true,
              value: {
                status: 'available',
                runtimeVersion: manifest.version,
                profileKey: updateStatus.profileKey,
                candidate: {
                  id: 'fixture',
                  version: '0.3.0',
                  notes: 'Fixture release notes',
                  compatibility: dshVersion,
                },
              },
            },
          },
        })
      })
      await page.route('**/api/dsh-glassui/update-begin', async route => {
        begins++
        submitted = route.request().postDataJSON().payload
        await route.fulfill({
          json: {
            type: 'server-response',
            rpcId: route.request().postDataJSON().rpcId,
            result: { ok: false, error: { code: 'dsh-glassui/settings', message: 'settings', details: {} } },
          },
        })
      })
      const range = page.getByRole('slider', { name: 'Transparency', exact: true })
      await page.getByRole('button', { name: 'Check plugin update', exact: true }).click()
      await page.getByRole('button', { name: 'Update plugin', exact: true }).waitFor()
      await range.fill('64')
      await page.getByRole('button', { name: 'Update plugin', exact: true }).click()
      await page
        .getByText('Settings could not be saved or changed elsewhere. Resolve the save error and try again.', {
          exact: true,
        })
        .waitFor()
      assert.equal(begins, 1)
      assert.equal(submitted.settings.tint, 64)
      // The real Host boot snapshot proves the debounce was flushed before begin.
      assert.equal(/"tint":64/.test(await pageHtml()), true)
      await page.evaluate(() => window.__GLASSUI_TEST_LOCALE__.set('ja'))
      await page.getByRole('heading', { name: 'Glass UIプラグイン', exact: true }).waitFor()
      await page.getByRole('switch', { name: 'ガラスの質感', exact: true }).click()
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-glassui'))
      await page.setViewportSize({ width: 390, height: 760 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.locator('.glassui-update').scrollIntoViewIfNeeded()
      assert.equal(await page.evaluate(() => document.querySelector('.glassui-update').scrollWidth <= innerWidth), true)
      assert.equal(await page.locator('style[data-test-locale-font]').count(), 1)
      await page.screenshot({ path: join(out, 'update-ja-off-narrow.png') })
      await page.getByRole('button', { name: '更新を確認', exact: true }).click()
      await page.getByRole('button', { name: '更新する', exact: true }).waitFor()
      const checkButton = page.getByRole('button', { name: '更新を確認', exact: true })
      // Read both rectangles together; independent protocol calls may observe
      // different frames of DSH's automatic scroll animation.
      const [first, second] = await page.locator('.glassui-update .glassui-actions').evaluate(row => {
        const buttons = [...row.querySelectorAll('button')]
        return ['更新を確認', '更新する'].map(label => {
          const button = buttons.find(element => element.textContent === label)
          if (!button) return null
          const rect = button.getBoundingClientRect()
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        })
      })
      assert.ok(
        first && second && (first.y + first.height <= second.y || first.x + first.width <= second.x),
        `update buttons do not overlap: ${JSON.stringify({ first, second })}`,
      )
      assert.equal(await checkButton.evaluate(element => element.scrollHeight <= element.clientHeight), true)
      await page.screenshot({ path: join(out, 'update-ja-candidate-narrow.png') })
      await page.getByRole('switch', { name: 'ガラスの質感', exact: true }).click()
      await storedEnabled(true)
      await page.evaluate(() => window.__GLASSUI_TEST_LOCALE__.set('zh'))
      await page.getByRole('heading', { name: 'Glass UI插件', exact: true }).waitFor()
      await page.screenshot({ path: join(out, 'update-zh-narrow.png') })
      await page.evaluate(() => window.__GLASSUI_TEST_LOCALE__.set('en'))
      assert.deepEqual(errors, [])
    } finally {
      await page.evaluate(() => window.__GLASSUI_TEST_LOCALE__.set('en'))
      if (!(await page.evaluate(() => window.__DSH_GLASSUI_DEBUG__.settings().enabled))) {
        await page.getByRole('switch', { name: 'Glass material', exact: true }).click()
        await storedEnabled(true)
      }
      await close()
    }
  })

  it('supports keyboard selection for layout and wallpaper', async () => {
    const { page, errors, close } = await open()
    try {
      await openSettings(page)
      const layout = page.getByRole('radiogroup', { name: 'Sidebar', exact: true })
      await layout.getByRole('radio', { name: 'Floating', exact: true }).focus()
      await page.keyboard.press('ArrowRight')
      assert.equal(
        await layout.getByRole('radio', { name: 'Docked', exact: true }).getAttribute('aria-checked'),
        'true',
      )
      assert.equal(await page.getAttribute('html', 'data-glassui-sidebar'), 'docked')
      await page.keyboard.press('Home')
      assert.equal(
        await layout.getByRole('radio', { name: 'Floating', exact: true }).getAttribute('aria-checked'),
        'true',
      )
      const wallpaper = page.getByRole('radiogroup', { name: 'Wallpaper', exact: true })
      await wallpaper.getByRole('radio', { name: 'Automatic', exact: true }).focus()
      await page.keyboard.press('End')
      assert.equal(
        await wallpaper.getByRole('radio', { name: 'Custom', exact: true }).getAttribute('aria-checked'),
        'true',
      )
      await page.keyboard.press('Home')
      assert.equal(await wallpaper.locator('[tabindex="0"]').count(), 1)
      assert.equal(
        await wallpaper.getByRole('radio', { name: 'Automatic', exact: true }).getAttribute('aria-checked'),
        'true',
      )
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('fits the settings content in a narrow DSH dialog', async () => {
    const { page, errors, close } = await open()
    try {
      await openSettings(page)
      for (const width of [800, 600]) {
        await page.setViewportSize({ width, height: 900 })
        await page.waitForFunction(() => window.__DSH_GLASSUI_DEBUG__.diagnostics().surfaces.panel > 0)
        const layout = await page.locator('.glassui-page').evaluate(root => {
          const box = root.getBoundingClientRect()
          const outside = [...root.querySelectorAll('button, input, textarea')].filter(element => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && (rect.left < box.left - 1 || rect.right > box.right + 1)
          })
          return {
            width: root.clientWidth,
            scroll: root.scrollWidth,
            outside: outside.map(element => element.className),
          }
        })
        assert.ok(layout.scroll <= layout.width + 1, JSON.stringify(layout))
        assert.deepEqual(layout.outside, [])
        const code = page.getByRole('radiogroup', { name: 'Code blocks', exact: true })
        await code.getByRole('radio', { name: 'Solid', exact: true }).click()
        // The indicator animates before reaching its selected cell.
        await page.waitForFunction(() => {
          const group = document.querySelector('[role="radiogroup"][aria-label="Code blocks"]')
          const option = group.querySelector('[aria-checked="true"]').getBoundingClientRect()
          const thumb = group.querySelector('.glassui-segmented__thumb').getBoundingClientRect()
          return Math.abs(thumb.left - option.left) < 1 && Math.abs(thumb.width - option.width) < 1
        })
        await code.getByRole('radio', { name: 'Glass', exact: true }).click()
        await page.screenshot({ path: join(out, `settings-${width}.png`) })
      }
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('offers manual copying when the clipboard is unavailable and omits custom image URLs', async () => {
    const { page, errors, close } = await open()
    try {
      await page.route('**/glassui-test.png?*', route =>
        route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/qXQAAAAASUVORK5CYII=',
            'base64',
          ),
        }),
      )
      await openSettings(page)
      await page.getByRole('radio', { name: 'Custom', exact: true }).click()
      const url = page.getByLabel('Image URL', { exact: true })
      await url.fill('/glassui-test.png?token=private-test-value')
      await url.press('Enter')
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }))
      await page.getByRole('button', { name: 'Copy diagnostics', exact: true }).click()
      const report = await page.getByRole('textbox', { name: 'Diagnostics', exact: true }).inputValue()
      assert.equal(JSON.parse(report).settings.wallpaperUrl, '[configured]')
      assert.ok(!report.includes('private-test-value'))
      await url.fill('')
      await url.press('Enter')
      await page.getByRole('radio', { name: 'Automatic', exact: true }).click()
      assert.deepEqual(errors, [])
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

  it('plays an animated wallpaper and keeps it after a reload', async () => {
    const { page, errors, close } = await open()
    const layer = () =>
      page.evaluate(() => {
        const element = document.querySelector('html > [data-glassui-owned="wallpaper"]')
        return element ? element.querySelectorAll('div').length : 0
      })
    try {
      await openSettings(page)
      await page.getByRole('radio', { name: 'Aurora, Live' }).click()
      await page.waitForFunction(() => document.documentElement.getAttribute('data-glassui-wallpaper') === 'aurora')
      assert.ok((await layer()) >= 3, 'moving layers in place')
      await page.keyboard.press('Escape')
      await page.screenshot({ path: join(out, 'aurora-light.png') })
      for (let attempt = 0; attempt < 40 && !(await pageHtml()).includes('"wallpaper":"aurora"'); attempt++) {
        await page.waitForTimeout(250)
      }
      await page.reload()
      await page.waitForFunction(() => '__DSH_GLASSUI_DEBUG__' in window)
      await page.waitForFunction(() => document.querySelector('[data-glassui-owned="wallpaper"]') !== null)
      // The engine starts before DSH has finished workspace/model bootstrap.
      // Wait for those real UI seats before opening an overlay after reload.
      await page.getByText('Default workspace', { exact: true }).first().waitFor()
      await page.locator('[data-composer-input][contenteditable="true"]').first().waitFor()
      await openSettings(page)
      await page.getByRole('radio', { name: 'Automatic' }).click()
      await page.waitForFunction(() => document.querySelector('[data-glassui-owned="wallpaper"]') === null)
      assert.deepEqual(errors, [])
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
