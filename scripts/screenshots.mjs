// Regenerates the screenshots in docs/images/ from a real DSH with the packed
// plugin installed (the E2E harness's world, model mock and browser).
//
//   node scripts/screenshots.mjs            DSH version from package.json "glassui.e2e.dsh"
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createWorld, installDsh, installPlugin, removeWorld, startWeb } from '../test/e2e/lib/dsh.mjs'
import { startMockLlm } from '../test/e2e/lib/mock-llm.mjs'
import { run, stopAll } from '../test/e2e/lib/procs.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const version = process.env.DSH_VERSION || manifest.glassui.e2e.dsh
const images = join(root, 'docs', 'images')
const logs = join(root, 'artifacts', 'screenshots')
mkdirSync(images, { recursive: true })
mkdirSync(logs, { recursive: true })

await run('build', process.execPath, ['scripts/build.mjs'], { cwd: root })
await run('pack', process.execPath, ['scripts/pack.mjs'], { cwd: root })
const dsh = await installDsh({
  version,
  dir: join(root, '.cache', 'e2e', `dsh-${version}`),
  logFile: join(logs, 'install-dsh.log'),
})
const world = await createWorld()
const mock = await startMockLlm()
let browser
try {
  await installPlugin({
    dsh,
    world,
    tarball: join(root, 'artifacts', `${manifest.name}-${manifest.version}.tgz`),
    logFile: join(logs, 'install-plugin.log'),
  })
  const web = await startWeb({ dsh, world, port: 4390, mockUrl: mock.url, logFile: join(logs, 'dsh-web.log') })
  browser = await chromium.launch({ executablePath: process.env.GLASSUI_CHROMIUM || undefined })
  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: scheme,
      locale: 'en-US',
    })
    const page = await context.newPage()
    await page.goto(web.url)
    await page.waitForFunction(() => '__DSH_GLASSUI_DEBUG__' in window)
    const proceed = page.getByRole('button', { name: 'Continue', exact: true })
    for (let quiet = 0; quiet < 6; quiet++) {
      if (await proceed.isVisible().catch(() => false)) {
        await proceed.click()
        quiet = 0
      }
      await page.waitForTimeout(400)
    }
    await page.screenshot({ path: join(images, `home-${scheme}.png`) })
    await page.locator('[data-composer-input][contenteditable="true"]').first().click()
    await page.keyboard.type('How should we make the theme survive DSH updates?')
    await page.keyboard.press('Enter')
    await page.getByText('Want me to start with step 1?').first().waitFor({ timeout: 60_000 })
    await page.mouse.move(820, 730)
    await page.waitForTimeout(1200)
    await page.screenshot({ path: join(images, `chat-${scheme}.png`) })
    await page.getByText('Settings', { exact: true }).first().click()
    await page.getByText('Glass UI', { exact: true }).first().click()
    await page.getByRole('switch', { name: 'Glass material' }).waitFor()
    // The section refreshes its diagnostics every second.
    await page.waitForTimeout(1500)
    await page.screenshot({ path: join(images, `settings-${scheme}.png`) })
    await context.close()
    console.log(`docs/images/*-${scheme}.png`)
  }
} finally {
  await browser?.close()
  await stopAll()
  await mock.close()
  await removeWorld(world)
}
