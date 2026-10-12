// A stand-in for DSH Web: the theme's token contract, a handful of components
// painted with those tokens, and the plugin's real build loaded the way DSH loads
// it (Host boot rows in the HTML, the client bundle through __ModuleLoader__).
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** DSH-like token rules: light on `body`, dark on `body[data-ds-dark-theme]`, elevation per element. */
export const THEME_CSS = `
body, body * {
  --dsw-elevation-stroke: 0 0 0 0.5px rgb(0 0 0 / 0.1);
  --dsw-elevation-panel: var(--dsw-elevation-stroke), 0 8px 24px rgb(0 0 0 / 0.12);
  --dsw-elevation-prominent: var(--dsw-elevation-stroke), 0 16px 40px rgb(0 0 0 / 0.16);
  --dsw-elevation-soft: var(--dsw-elevation-stroke), 0 2px 8px rgb(0 0 0 / 0.06);
}
body {
  --dsw-alias-bg-base: #ffffff;
  --dsw-alias-bg-layer-1: #ffffff;
  --dsw-alias-bg-layer-2: #ffffff;
  --dsw-alias-bg-layer-3: #f5f6f7;
  --dsw-specific-input-major: #ffffff;
  --dsw-specific-sidebar-fill: #f7f8f9;
  --dsw-alias-toast-bg: #1e1e20;
  --dsw-alias-tooltip-bg: #1e1e20;
  --dsw-alias-button-floating-fill: #ffffff;
  --dsw-alias-button-elevated-fill: #ffffff;
  --dsw-alias-bg-overlay: rgb(0 0 0 / 0.4);
  --dsw-menu-surface-fill: rgb(255 255 255 / 0.82);
  --dsw-menu-backdrop-filter: blur(20px) saturate(180%);
  --dsw-specific-menu: #ffffff;
  --dsw-alias-menu-group-header-fill: #ffffff;
  --dsw-alias-markdown-code-block: #f5f6f7;
  --dsw-alias-markdown-code-block-banner: #eef0f2;
  --dsw-alias-markdown-inline-code: #f0f1f3;
  --dsw-alias-markdown-citation: #eef0f2;
  --dsw-alias-markdown-tag: #eef0f2;
  --dsw-alias-markdown-placeholder: #f5f6f7;
  --dsw-specific-bubble: #eef3ff;
  --dsw-specific-selector: #ffffff;
  --dsw-specific-tip: #fff7e6;
  --dsw-specific-login-input: #ffffff;
  --dsw-specific-sidebar-nav-item-active: #eceef0;
  --dsw-specific-sidebar-nav-item-hover: #f0f1f3;
  --dsw-alias-bg-module-platform: #ffffff;
  --dsw-alias-bg-multi-select: #eef3ff;
  --dsw-alias-bg-document-preview: #ffffff;
  --dsw-alias-interactive-bg-hover-solid: #f0f1f3;
  --dsw-alias-button-primary-dimmed: #c9ccd1;
  --dsw-alias-label-primary: #111214;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
}
body[data-ds-dark-theme] {
  --dsw-alias-bg-base: #161618;
  --dsw-alias-bg-layer-1: #1c1c1f;
  --dsw-alias-bg-layer-2: #232326;
  --dsw-alias-bg-layer-3: #2a2a2e;
  --dsw-specific-input-major: #232326;
  --dsw-specific-sidebar-fill: #1c1c1f;
  --dsw-alias-toast-bg: #2c2c30;
  --dsw-alias-tooltip-bg: #2c2c30;
  --dsw-alias-button-floating-fill: #2a2a2e;
  --dsw-alias-button-elevated-fill: #2a2a2e;
  --dsw-menu-surface-fill: rgb(35 35 38 / 0.82);
  --dsw-specific-menu: #232326;
  --dsw-alias-menu-group-header-fill: #232326;
  --dsw-alias-markdown-code-block: #1c1c1f;
  --dsw-specific-selector: #232326;
  --dsw-alias-bg-module-platform: #232326;
  --dsw-alias-bg-document-preview: #232326;
  --dsw-alias-label-primary: #f3f4f6;
}
html, body { margin: 0; height: 100%; font: 14px/1.4 system-ui, sans-serif; }
.frame { position: fixed; inset: 0; display: flex; background: var(--dsw-alias-bg-base); }
.sidebar { width: 280px; flex: none; background: var(--dsw-specific-sidebar-fill); padding: 14px; box-sizing: border-box; }
.sidebar-inner { height: 100%; background: var(--dsw-specific-sidebar-fill); }
.main { position: relative; flex: 1; overflow: auto; }
.composer { position: absolute; left: 120px; right: 120px; bottom: 24px; height: 110px; border-radius: 28px;
  background: var(--dsw-specific-input-major); box-shadow: var(--dsw-elevation-soft); }
.dialog { position: fixed; left: 420px; top: 80px; width: 420px; height: 260px; border-radius: 20px;
  background: var(--dsw-alias-bg-layer-2); box-shadow: var(--dsw-elevation-panel); }
.menu { position: fixed; left: 900px; top: 80px; width: 200px; height: 120px; border-radius: 12px;
  background: var(--dsw-menu-surface-fill); backdrop-filter: var(--dsw-menu-backdrop-filter); }
.toast { position: fixed; left: 900px; top: 240px; width: 220px; height: 44px; border-radius: 12px;
  background: var(--dsw-alias-toast-bg); color: white; }
/* Like DSH's code block: the header repaints the block's fill through a local variable. */
.code { --code-local-bg: var(--dsw-alias-markdown-code-block); margin: 20px; height: 110px; border-radius: 16px; background: var(--code-local-bg); }
.code-header { height: 28px; border-radius: 16px 16px 0 0; background: var(--code-local-bg); }
.code-banner { height: 20px; background: var(--dsw-alias-markdown-code-block-banner); }
.inline-code { display: inline-block; margin: 0 20px; padding: 2px 6px; background: var(--dsw-alias-markdown-inline-code); }
.flat-card { margin: 20px; height: 60px; background: var(--dsw-alias-bg-layer-2); }
.chat p { margin: 4px 20px; }
`

/** Components painted with tokens only, like DSH and its plugins. */
export const BODY_HTML = `
<div class="frame" id="frame">
  <aside class="sidebar" id="sidebar"><div class="sidebar-inner" id="sidebar-inner">Sessions</div></aside>
  <main class="main" id="main">
    <div class="chat" id="chat"><p>Hello</p></div>
    <div class="code" id="code"><div class="code-header" id="code-header">ts</div><div class="code-banner" id="code-banner">banner</div><pre>const x = 1</pre></div>
    <p>Call <span class="inline-code" id="inline-code">tokens.ts</span> first.</p>
    <div class="flat-card" id="flat-card">A card without elevation</div>
    <div data-glassui-ignore id="ignored"><div class="dialog" id="ignored-dialog" style="left: 40px; top: 600px; width: 100px; height: 60px"></div></div>
    <div class="composer" id="composer"><div style="padding: 16px">Message…</div></div>
  </main>
</div>
<div class="dialog" id="dialog">Dialog</div>
<div class="menu" id="menu">Menu</div>
<div class="toast" id="toast">Saved</div>
`

/** Evaluate the Host half and return the rows it injects into every page. */
export async function hostRows(config = {}) {
  const host = await import(pathToFileURL(resolve(root, 'dist/index.js')).href)
  const settings = host.Config(config)
  let handler
  host.apply(
    { on: (event, listener) => (event === 'webserver/index-inject' ? (handler = listener) : undefined) },
    settings,
  )
  const table = []
  handler(table)
  return table
}

/** Render the boot rows the way DSH's webserver does. */
function renderRows(rows, placement) {
  return rows
    .map(row => {
      if (row.kind === 'style' && placement === 'head') return `<style>${row.text}</style>`
      if (row.kind === 'global' && placement === 'head') {
        return `<script>window[${JSON.stringify(row.name)}] = ${JSON.stringify(row.value).replace(/</g, '\\u003c')}</script>`
      }
      if (row.kind === 'script' && row.placement === placement) return `<script>${row.text}</script>`
      return ''
    })
    .join('\n')
}

/** In-page harness: module loader, DSH context and a settings form double. */
const HARNESS = `
window.__fixture = (() => {
  const modules = {
    react: { useSyncExternalStore() {}, useState() { return [] }, useEffect() {}, useMemo(fn) { return fn() }, useRef() { return {} }, useCallback(fn) { return fn }, useId() { return 'id' } },
    'react/jsx-runtime': { jsx() { return null }, jsxs() { return null }, Fragment: 'fragment' },
    'react-dom': {},
  }
  const require = name => {
    if (!(name in modules)) throw new Error('unexpected require: ' + name)
    return modules[name]
  }
  let plugin
  window.__ModuleLoader__ = { load({ id, factory }) { const module = { exports: {} }; plugin = { id, exports: factory(require, module, module.exports) ?? module.exports } } }

  class Form {
    constructor(value) { this.snapshot = { status: 'ready', value, writable: true }; this.listeners = new Set(); this.writes = [] }
    getSnapshot() { return this.snapshot }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
    async set(field, value) { this.writes.push([field, value]); this.update({ [field]: value }); return true }
    update(patch) { this.snapshot = { ...this.snapshot, value: { ...this.snapshot.value, ...patch } }; for (const l of this.listeners) l() }
  }

  return {
    get plugin() { return plugin },
    start(options = {}) {
      const disposers = []
      const form = options.form === false ? undefined : new Form(options.settings ?? {})
      const ctx = {
        effect(fn) { const dispose = fn(); if (typeof dispose === 'function') disposers.push(dispose) },
        inject(names, callback) {
          if (names.every(name => name === 'configForms' && form)) callback({ ...ctx, configForms: { get: () => form } })
        },
      }
      plugin.exports.apply(ctx)
      this.form = form
      this.dispose = () => { while (disposers.length > 0) disposers.pop()() }
    },
    debug() { return window.__DSH_GLASSUI_DEBUG__ },
    frames(count = 2) { return new Promise(resolve => { const step = n => n === 0 ? resolve() : requestAnimationFrame(() => step(n - 1)); step(count) }) },
  }
})()
`

/**
 * Build the fixture page.
 * @param {object} options
 * @param {boolean} [options.plugin] - include the plugin (default true).
 * @param {object} [options.config] - Host config (plugin settings).
 * @param {boolean} [options.dark] - start in the dark palette.
 * @param {string} [options.extraBody] - extra markup appended to the body.
 */
export async function pageHtml({ plugin = true, config = {}, dark = false, extraBody = '' } = {}) {
  const rows = plugin ? await hostRows(config) : []
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>fixture</title>
<style>${THEME_CSS}</style>
${renderRows(rows, 'head')}
</head><body${dark ? ' data-ds-dark-theme' : ''}>
${BODY_HTML}${extraBody}
${renderRows(rows, 'body')}
</body></html>`
}

let browserPromise

/** One Chromium for the whole test run. */
export function browser() {
  browserPromise ??= chromium.launch({
    executablePath: process.env.GLASSUI_CHROMIUM || undefined,
  })
  return browserPromise
}

export async function closeBrowser() {
  if (browserPromise) await (await browserPromise).close()
  browserPromise = undefined
}

/**
 * Open the fixture with the plugin's client half loaded and started.
 * @param {object} [options] - see {@link pageHtml}; plus `start` (default true) and `reducedMotion`.
 */
export async function openFixture(options = {}) {
  const context = await (
    await browser()
  ).newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: options.dark ? 'dark' : 'light',
    reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(new Error(message.text()))
  })
  await page.setContent(await pageHtml(options))
  await page.addScriptTag({ content: HARNESS })
  if (options.plugin !== false) {
    await page.addScriptTag({ content: await readFile(resolve(root, 'dist/client.js'), 'utf8') })
    if (options.start !== false) {
      await page.evaluate(settings => window.__fixture.start({ settings }), options.config ?? {})
      await settle(page)
    }
  }
  return { page, errors, close: () => context.close() }
}

/** Wait until the engine has processed pending work. */
export async function settle(page, frames = 6) {
  await page.evaluate(count => window.__fixture.frames(count), frames)
}

/** Surface attributes of every fixture element that has them. */
export function surfaces(page) {
  return page.evaluate(() => {
    const out = {}
    for (const element of document.querySelectorAll('[id]')) {
      if (!element.hasAttribute('data-glassui-surface')) continue
      out[element.id] = {
        kind: element.getAttribute('data-glassui-surface'),
        fill: element.getAttribute('data-glassui-fill'),
        flat: element.hasAttribute('data-glassui-flat'),
        float: element.hasAttribute('data-glassui-float'),
        lens: element.getAttribute('data-glassui-lens'),
      }
    }
    return out
  })
}
