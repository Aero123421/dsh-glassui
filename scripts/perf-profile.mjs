// Measures the glass engine under the integration fixture.
// CPU is renderer TaskDuration / ScriptDuration / LayoutDuration from Chrome's
// performance metrics. GPU time is the sum of GPUTask events in a DevTools
// trace when the browser emits them. Memory is the JS heap plus process
// private bytes (renderer and GPU) from SystemInfo.
//
//   GLASSUI_CHROMIUM=/usr/bin/google-chrome-stable node scripts/perf-profile.mjs artifacts/perf-before
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { closeBrowser, openFixture, settle } from '../test/integration/fixture.mjs'

const outDir = process.argv[2] ?? 'artifacts/perf-profile'
const shotDir = join(outDir, 'shots')
await mkdir(shotDir, { recursive: true })

const TRACE_NAMES = new Set([
  'GPUTask',
  'Paint',
  'CompositeLayers',
  'UpdateLayer',
  'RasterTask',
  'Layout',
  'UpdateLayoutTree',
  'RunTask',
  'FireAnimationFrame',
  'BeginFrame',
  'DrawFrame',
  'Commit',
])

function delta(before, after) {
  const out = {}
  for (const key of Object.keys(after)) {
    if (typeof after[key] === 'number' && typeof before[key] === 'number') out[key] = after[key] - before[key]
  }
  return out
}

async function appearance(page) {
  return page.evaluate(() => {
    const pick = id => {
      const element = document.getElementById(id)
      if (!element) return null
      const style = getComputedStyle(element)
      return {
        surface: element.getAttribute('data-glassui-surface'),
        fill: element.getAttribute('data-glassui-fill'),
        flat: element.hasAttribute('data-glassui-flat'),
        lens: element.getAttribute('data-glassui-lens'),
        background: style.backgroundColor,
        backdrop: style.backdropFilter,
        radius: style.borderTopLeftRadius,
      }
    }
    const root = document.documentElement
    return {
      surfaces: ['sidebar', 'composer', 'dialog', 'menu', 'toast', 'code', 'code-header'].map(id => [id, pick(id)]),
      wallpaper: root.getAttribute('data-glassui-wallpaper'),
      staticWallpaper: root.hasAttribute('data-glassui-static-wallpaper'),
      blur: document.querySelector('feGaussianBlur')?.getAttribute('stdDeviation') ?? null,
      lenses: document.querySelectorAll('[data-glassui-lens]').length,
    }
  })
}

async function traceDuring(page, run) {
  const cdp = await page.context().newCDPSession(page)
  const sums = {}
  const counts = {}
  const onData = payload => {
    for (const event of payload.value ?? []) {
      if (!TRACE_NAMES.has(event.name) || typeof event.dur !== 'number') continue
      sums[event.name] = (sums[event.name] ?? 0) + event.dur
      counts[event.name] = (counts[event.name] ?? 0) + 1
    }
  }
  cdp.on('Tracing.dataCollected', onData)
  let complete
  const finished = new Promise(resolve => {
    complete = resolve
  })
  cdp.on('Tracing.tracingComplete', () => complete())
  try {
    await cdp.send('Tracing.start', {
      traceConfig: {
        recordMode: 'recordContinuously',
        includedCategories: [
          'disabled-by-default-devtools.timeline',
          'devtools.timeline',
          'disabled-by-default-devtools.timeline.frame',
          'gpu',
          'cc',
          'toplevel',
        ],
      },
    })
  } catch (error) {
    await cdp.detach().catch(() => {})
    return { error: String(error) }
  }
  try {
    await run()
  } finally {
    await cdp.send('Tracing.end').catch(() => {})
    await Promise.race([finished, new Promise(resolve => setTimeout(resolve, 8000))])
    await cdp.detach().catch(() => {})
  }
  const milliseconds = {}
  for (const [name, microseconds] of Object.entries(sums)) milliseconds[name] = Math.round(microseconds / 1000)
  return { milliseconds, counts }
}

async function metricReader(page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  return {
    async read() {
      const { metrics } = await cdp.send('Performance.getMetrics')
      return Object.fromEntries(metrics.map(item => [item.name, item.value]))
    },
    async close() {
      await cdp.detach().catch(() => {})
    },
  }
}

async function sample(reader, page, ms, activity, withTrace = false) {
  const before = await reader.read()
  const started = Date.now()
  let trace
  const run = async () => {
    if (activity) await activity()
    else await page.waitForTimeout(ms)
  }
  if (withTrace) trace = await traceDuring(page, run)
  else await run()
  const after = await reader.read()
  const heap = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null).catch(() => null)
  return {
    wallMs: Date.now() - started,
    metrics: delta(before, after),
    heap,
    ...(trace ? { trace } : {}),
  }
}

async function processes(browser) {
  if (typeof browser.newBrowserCDPSession !== 'function') return { error: 'no browser CDP session' }
  const session = await browser.newBrowserCDPSession()
  try {
    const info = await session.send('SystemInfo.getProcessInfo')
    return (info.processInfo ?? info.processes ?? []).map(item => ({
      type: item.type,
      privateMemory: item.privateMemory ?? item.privateMemoryBytes,
      cpuTime: item.cpuTime,
    }))
  } catch (error) {
    return { error: String(error) }
  } finally {
    await session.detach().catch(() => {})
  }
}

const matrix = []
for (const scheme of ['light', 'dark']) {
  for (const wallpaper of ['bay', 'tide']) {
    for (const refraction of [false, true]) {
      for (const form of [
        { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
        { name: 'tablet', viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2 },
      ]) {
        matrix.push({
          name: `${form.name}-${scheme}-${wallpaper}-${refraction ? 'lens' : 'blur'}`,
          dark: scheme === 'dark',
          config: { wallpaper, refraction },
          viewport: form.viewport,
          deviceScaleFactor: form.deviceScaleFactor,
          shot: wallpaper === 'bay',
        })
      }
    }
  }
}

const results = []
let gpu = null

async function measure(
  name,
  options,
  { shot = false, activity, idleMs = 2000, traceIdle = false, traceActive = false } = {},
) {
  const opened = await openFixture({ ...options, start: false })
  try {
    if (!gpu) {
      const browser = opened.page.context().browser()
      if (browser && typeof browser.newBrowserCDPSession === 'function') {
        const session = await browser.newBrowserCDPSession()
        gpu = await session.send('SystemInfo.getInfo').catch(error => ({ error: String(error) }))
        await session.detach().catch(() => {})
      }
    }
    const reader = await metricReader(opened.page)
    const startup = await sample(reader, opened.page, 0, async () => {
      await opened.page.evaluate(settings => window.__fixture.start({ settings }), options.config ?? {})
      await settle(opened.page, 24)
      await opened.page.waitForTimeout(300)
    })
    if (shot) await opened.page.screenshot({ path: join(shotDir, `${name}.png`) })
    const look = await appearance(opened.page)
    const idle = await sample(reader, opened.page, idleMs, undefined, traceIdle)
    const active = activity ? await sample(reader, opened.page, 0, () => activity(opened.page), traceActive) : undefined
    await reader.close()
    const scans = await opened.page.evaluate(() => window.__fixture.debug().diagnostics().scans)
    const proc = await processes(opened.page.context().browser())
    const row = {
      name,
      options: {
        dark: options.dark === true,
        config: options.config ?? {},
        viewport: options.viewport ?? { width: 1440, height: 900 },
        deviceScaleFactor: options.deviceScaleFactor ?? 1,
        hasTouch: options.hasTouch === true,
      },
      appearance: look,
      startup,
      idle,
      active,
      scans,
      processes: proc,
      errors: opened.errors.map(error => error.message),
    }
    results.push(row)
    const task = idle.metrics.TaskDuration
    const gpuMs = idle.trace?.milliseconds?.GPUTask
    console.log(
      `${name} idle task ${typeof task === 'number' ? task.toFixed(3) : '?'}s gpuTask ${gpuMs ?? 'n/a'}ms heap ${idle.heap}`,
    )
    return row
  } finally {
    await opened.close()
  }
}

for (const item of matrix) {
  await measure(
    item.name,
    {
      dark: item.dark,
      config: item.config,
      viewport: item.viewport,
      deviceScaleFactor: item.deviceScaleFactor,
    },
    {
      shot: item.shot,
      traceIdle:
        item.name === 'desktop-light-bay-lens' ||
        item.name === 'desktop-light-tide-lens' ||
        item.name === 'tablet-light-tide-lens',
    },
  )
}

await measure(
  'ipad-light-tide-lens',
  {
    config: { wallpaper: 'tide', refraction: true },
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  },
  { shot: false, traceIdle: true },
)
await measure(
  'android-light-bay-lens',
  {
    config: { wallpaper: 'bay', refraction: true },
    viewport: { width: 800, height: 1280 },
    deviceScaleFactor: 2.625,
    hasTouch: true,
    isMobile: true,
  },
  { shot: true, traceIdle: true },
)

await measure(
  'desktop-light-tide-lens-stream',
  {
    config: { wallpaper: 'tide', refraction: true },
    viewport: { width: 1440, height: 900 },
  },
  {
    idleMs: 500,
    traceActive: true,
    activity: async page => {
      await page.evaluate(async () => {
        const chat = document.getElementById('chat')
        for (let batch = 0; batch < 20; batch++) {
          const fragment = document.createDocumentFragment()
          for (let index = 0; index < 200; index++) {
            const row = document.createElement('div')
            row.innerHTML =
              '<div data-markdown-variant="message"><p>Line <b>bold</b> <code>code</code></p>' +
              '<ul><li>a</li><li>b</li></ul><pre><code>x = 1</code></pre><table><tr><td>1</td></tr></table></div>'
            fragment.append(row)
          }
          chat.append(fragment)
          await window.__fixture.frames(1)
        }
        await window.__fixture.frames(8)
      })
    },
  },
)

await measure(
  'desktop-light-bay-lens-pointer',
  {
    config: { wallpaper: 'bay', refraction: true },
    viewport: { width: 1440, height: 900 },
  },
  {
    idleMs: 400,
    traceActive: true,
    activity: async page => {
      const box = await page.locator('#composer').boundingBox()
      for (let index = 0; index < 120; index++) {
        await page.mouse.move(box.x + 30 + (index % 50) * 4, box.y + 20 + (index % 15) * 3)
      }
    },
  },
)

await measure(
  'ipad-light-bay-lens-scroll-rotate',
  {
    config: { wallpaper: 'bay', refraction: true },
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  },
  {
    shot: true,
    idleMs: 400,
    traceActive: true,
    activity: async page => {
      await page.evaluate(async () => {
        const main = document.getElementById('main')
        for (let index = 0; index < 40; index++) {
          main.scrollTop = index * 20
          await window.__fixture.frames(1)
        }
      })
      await page.setViewportSize({ width: 1366, height: 1024 })
      await settle(page, 12)
      await page.waitForTimeout(400)
      await page.setViewportSize({ width: 1024, height: 1366 })
      await settle(page, 12)
      await page.waitForTimeout(400)
    },
  },
)

await measure(
  'desktop-light-bay-lens-rebuild',
  {
    config: { wallpaper: 'bay', refraction: true },
    viewport: { width: 1440, height: 900 },
  },
  {
    idleMs: 300,
    traceActive: true,
    activity: async page => {
      await page.evaluate(async () => {
        const composer = document.getElementById('composer')
        for (const width of [480, 720, 960, 640]) {
          composer.style.width = `${width}px`
          await new Promise(resolve => setTimeout(resolve, 220))
        }
        await window.__fixture.frames(8)
      })
    },
  },
)

await closeBrowser()
const summary = {
  capturedAt: new Date().toISOString(),
  chrome: gpu?.userAgent ?? gpu,
  gpu: gpu?.gpu ?? gpu,
  outDir,
  results,
}
await writeFile(join(outDir, 'summary.json'), JSON.stringify(summary))
const digest = createHash('sha256')
  .update(JSON.stringify(results.map(row => row.appearance)))
  .digest('hex')
console.log(`wrote ${join(outDir, 'summary.json')} appearance ${digest}`)
