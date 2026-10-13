// The built client half on a DSH-like page in Chromium.
import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { closeBrowser, openFixture, settle, surfaces } from './fixture.mjs'

after(closeBrowser)

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

/** Read a computed color: `rgb()`, `rgba()` or `color(srgb …)` (what color-mix() serializes to). */
function color(value) {
  const legacy = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(value)
  if (legacy) return { r: +legacy[1], g: +legacy[2], b: +legacy[3], a: legacy[4] === undefined ? 1 : +legacy[4] }
  const srgb = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value)
  if (srgb) {
    const channel = text => Math.round(Number(text) * 255)
    return { r: channel(srgb[1]), g: channel(srgb[2]), b: channel(srgb[3]), a: srgb[4] === undefined ? 1 : +srgb[4] }
  }
  throw new Error(`unexpected color ${value}`)
}

/** Computed styles that matter for the look, for every fixture element. */
function snapshot(page) {
  return page.evaluate(() => {
    const out = {}
    for (const element of [document.documentElement, document.body, ...document.querySelectorAll('[id]')]) {
      const style = getComputedStyle(element)
      out[element.id || element.tagName] = [
        style.backgroundColor,
        style.backgroundImage,
        style.boxShadow,
        style.backdropFilter,
        style.margin,
        style.clipPath,
      ].join(' | ')
    }
    return out
  })
}

describe('discovery', () => {
  it('finds every DSH surface by its tokens and nothing else', async () => {
    const { page, errors, close } = await openFixture()
    try {
      const found = await surfaces(page)
      assert.equal(found.frame?.kind, 'backdrop')
      assert.deepEqual(found.sidebar, { kind: 'sidebar', fill: 'sidebar', flat: false, float: true, lens: null })
      assert.equal(found['sidebar-inner']?.flat, true)
      assert.equal(found.composer?.kind, 'composer')
      assert.equal(found.dialog?.kind, 'panel')
      assert.equal(found.menu?.kind, 'menu')
      assert.equal(found.toast?.kind, 'smoke')
      assert.equal(found.code?.kind, 'code', 'code blocks are glass by default')
      assert.equal(found['code-header'], undefined, 'the header is an echo, not a surface')
      assert.equal(found['code-banner']?.flat, true, 'a banner inside a block adds no second layer')
      assert.equal(found['inline-code'], undefined, 'reserved tokens are never glass')
      assert.equal(found['flat-card'], undefined, 'a card without elevation is not a panel')
      assert.equal(found['ignored-dialog'], undefined, 'data-glassui-ignore is respected')
      const diagnostics = await page.evaluate(() => window.__fixture.debug().diagnostics())
      assert.equal(diagnostics.running, true)
      assert.deepEqual(diagnostics.missingTokens, [])
      assert.deepEqual(diagnostics.ambiguousTokens, [])
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('turns surfaces into glass and paints the wallpaper', async () => {
    const { page, close } = await openFixture()
    try {
      const styles = await page.evaluate(() => {
        const read = id => getComputedStyle(document.getElementById(id))
        return {
          root: document.documentElement.getAttribute('data-glassui'),
          wallpaper: document.documentElement.getAttribute('data-glassui-wallpaper'),
          composer: read('composer').backgroundColor,
          composerFilter: read('composer').backdropFilter,
          frame: read('frame').backgroundColor,
          inner: read('sidebar-inner').backgroundColor,
          sidebarClip: read('sidebar').clipPath,
          code: read('code').backgroundColor,
          header: read('code-header').backgroundColor,
          headerEcho: document.getElementById('code-header').hasAttribute('data-glassui-echo'),
          banner: read('code-banner').backgroundColor,
          inlineCode: read('inline-code').backgroundColor,
        }
      })
      assert.equal(styles.root, 'on')
      assert.equal(styles.wallpaper, 'bay')
      const composer = color(styles.composer)
      assert.ok(composer.r >= 252 && composer.g >= 252 && composer.b >= 252, styles.composer)
      assert.ok(composer.a > 0.1 && composer.a < 0.9, `translucent: ${styles.composer}`)
      assert.match(styles.composerFilter, /blur|url/)
      assert.equal(color(styles.frame).a, 0, 'layout panes become transparent')
      assert.equal(color(styles.inner).a, 0, 'nested surfaces do not stack glass')
      assert.match(styles.sidebarClip, /^inset\(8px round 18px\)$/)
      const code = color(styles.code)
      assert.ok(code.a > 0.5 && code.a < 1, `code blocks are a denser glass: ${styles.code}`)
      assert.equal(styles.headerEcho, true, 'a part repainting the block’s glass is recognized')
      assert.equal(color(styles.header).a, 0, 'and turns clear, so the block is one layer of glass')
      assert.equal(color(styles.banner).a, 0, 'the banner fill is clear inside a glass block')
      assert.equal(color(styles.inlineCode).a, 0.72, 'inline code has its independent default opacity')
    } finally {
      await close()
    }
  })

  it('follows DOM changes', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => {
        const toast = document.createElement('div')
        toast.id = 'late-toast'
        toast.className = 'toast'
        toast.style.top = '320px'
        document.body.append(toast)
        document.getElementById('flat-card').style.boxShadow = 'var(--dsw-elevation-panel)'
        const card = document.getElementById('flat-card')
        card.className = 'flat-card raised'
      })
      await settle(page)
      let found = await surfaces(page)
      assert.equal(found['late-toast']?.kind, 'smoke')
      await page.evaluate(() => document.getElementById('toast').remove())
      await settle(page)
      found = await surfaces(page)
      assert.equal(found.toast, undefined)
    } finally {
      await close()
    }
  })

  it('follows a palette switch', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
      await settle(page, 10)
      const found = await surfaces(page)
      assert.equal(found.composer?.kind, 'composer')
      assert.equal(found.dialog?.kind, 'panel')
      const composer = await page.evaluate(() => getComputedStyle(document.getElementById('composer')).backgroundColor)
      const glass = color(composer)
      assert.ok(glass.r < 48 && glass.g < 48 && glass.b < 48 && glass.a < 0.9, `dark glass, got ${composer}`)
      const diagnostics = await page.evaluate(() => window.__fixture.debug().diagnostics())
      assert.deepEqual(diagnostics.ambiguousTokens, [])
    } finally {
      await close()
    }
  })
})

describe('layout resizing', () => {
  it('keeps existing glass through every frame of an ancestor resize drag', async () => {
    const { page, errors, close } = await openFixture({ start: false })
    try {
      await page.addStyleTag({
        content:
          '.frame { display: grid; grid-template-columns: 280px 1fr } .sidebar { width: auto }' +
          '.composer { width: var(--content-width, auto) }',
      })
      await page.evaluate(() => window.__fixture.start())
      await settle(page, 12)
      const result = await page.evaluate(async () => {
        const frame = document.getElementById('frame')
        const main = document.getElementById('main')
        const sidebar = document.getElementById('sidebar')
        const composer = document.getElementById('composer')
        const code = document.getElementById('code')
        const header = document.getElementById('code-header')
        const before = sidebar.getBoundingClientRect().width
        const samples = []
        for (let index = 1; index <= 20; index++) {
          await new Promise(resolve =>
            requestAnimationFrame(() => {
              // DSH writes the grid size, then publishes conversation widths
              // through custom properties as the split pane changes size.
              frame.style.gridTemplateColumns = `${280 + index * 4}px 1fr`
              main.style.setProperty('--content-width', `${600 - index * 4}px`)
              queueMicrotask(() => {
                samples.push({
                  sidebar: sidebar.getAttribute('data-glassui-surface'),
                  composer: composer.getAttribute('data-glassui-surface'),
                  code: code.getAttribute('data-glassui-surface'),
                  filter: getComputedStyle(sidebar).backdropFilter,
                  header: getComputedStyle(header).backgroundColor,
                })
                resolve()
              })
            }),
          )
        }
        return { before, after: sidebar.getBoundingClientRect().width, samples }
      })
      assert.ok(result.after > result.before, 'the boundary really moved')
      for (const sample of result.samples) {
        assert.equal(sample.sidebar, 'sidebar', 'sidebar glass survives before paint')
        assert.equal(sample.composer, 'composer', 'composer glass survives before paint')
        assert.equal(sample.code, 'code', 'content glass survives before paint')
        assert.match(sample.filter, /blur\(/, 'the sidebar keeps its blur during the drag')
        assert.equal(color(sample.header).a, 0, 'nested code headers stay clear')
      }
      await settle(page, 12)
      assert.equal((await surfaces(page))['sidebar-inner']?.flat, true)
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })
})

describe('coexistence', () => {
  it('updates live opt-outs, including newly inserted descendants', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => {
        document.getElementById('main').setAttribute('data-glassui-ignore', '')
        const container = document.createElement('div')
        container.innerHTML = '<div id="late-ignored" class="dialog"></div>'
        document.getElementById('main').append(container)
      })
      await settle(page, 10)
      const found = await surfaces(page)
      assert.equal(found.composer, undefined)
      assert.equal(found.code, undefined)
      assert.equal(found['late-ignored'], undefined)
      assert.equal(await page.locator('#main [data-glassui-lens], #main [data-glassui-echo]').count(), 0)
      await page.evaluate(() => document.getElementById('main').removeAttribute('data-glassui-ignore'))
      await settle(page, 10)
      assert.equal((await surfaces(page)).composer?.kind, 'composer')
    } finally {
      await close()
    }
  })

  it('clears code header echoes when the exclusion changes', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => window.__fixture.form.update({ exclude: '#code-header' }))
      await settle(page)
      assert.equal(await page.locator('#code-header').getAttribute('data-glassui-echo'), null)
      assert.notEqual(
        await page.locator('#code-header').evaluate(element => getComputedStyle(element).backgroundColor),
        'rgba(0, 0, 0, 0)',
      )
    } finally {
      await close()
    }
  })

  it('reclassifies descendants after an ancestor class or inline style changes', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => {
        const style = document.createElement('style')
        style.textContent = '.changed .dialog { background: rgb(200, 0, 0) }'
        document.head.append(style)
        document.getElementById('flat-card').style.boxShadow = 'var(--dsw-elevation-panel)'
        document.body.classList.add('changed')
      })
      await settle(page, 10)
      const found = await surfaces(page)
      assert.equal(found['flat-card']?.kind, 'panel')
      assert.equal(found.dialog, undefined)
    } finally {
      await close()
    }
  })
  it('lets another plugin’s token overrides win', async () => {
    const { page, close } = await openFixture()
    try {
      // What DSH's ThemePresenter does for ctx.theme.overrideTokens: inline values on <body>.
      await page.evaluate(() => document.body.style.setProperty('--dsw-alias-bg-layer-2', 'rgb(200 0 0)'))
      await settle(page, 10)
      const found = await surfaces(page)
      assert.equal(found.dialog?.kind, 'panel')
      const dialog = await page.evaluate(() => getComputedStyle(document.getElementById('dialog')).backgroundColor)
      const glass = color(dialog)
      assert.deepEqual([glass.r, glass.g, glass.b], [200, 0, 0], `the override shows through the glass, got ${dialog}`)
      assert.ok(glass.a < 1)
      const card = await page.evaluate(() => getComputedStyle(document.getElementById('flat-card')).backgroundColor)
      assert.equal(card, 'rgb(200, 0, 0)')
    } finally {
      await close()
    }
  })

  it('leaves elements under an exclusion selector alone', async () => {
    const { page, close } = await openFixture({ config: { exclude: '#dialog, .menu' } })
    try {
      const found = await surfaces(page)
      assert.equal(found.dialog, undefined)
      assert.equal(found.menu, undefined)
      assert.equal(found.composer?.kind, 'composer')
    } finally {
      await close()
    }
  })

  it('styles another plugin’s element that opts in with data-glassui-material', async () => {
    const { page, close } = await openFixture({
      extraBody:
        '<div id="opt-in" data-glassui-material="dense" style="position:fixed;left:10px;top:10px;width:50px;height:50px;background:#fff;box-shadow:var(--dsw-elevation-panel)"></div>',
    })
    try {
      const found = await surfaces(page)
      assert.equal(found['opt-in'], undefined, 'never classified')
      const style = await page.evaluate(() => getComputedStyle(document.getElementById('opt-in')))
      assert.ok(style)
      const filter = await page.evaluate(() => getComputedStyle(document.getElementById('opt-in')).backdropFilter)
      assert.match(filter, /blur/)
    } finally {
      await close()
    }
  })
})

describe('settings', () => {
  it('updates the material and refraction blur when stronger contrast is requested', async () => {
    const { page, close } = await openFixture()
    try {
      await page.emulateMedia({ contrast: 'more' })
      await settle(page, 10)
      assert.equal((await surfaces(page)).composer?.kind, 'composer')
      await page.waitForFunction(() => {
        const element = document.getElementById('composer')
        const filter = document.getElementById(`glassui-lens-${element.getAttribute('data-glassui-lens')}`)
        return filter?.querySelector('feGaussianBlur')?.getAttribute('stdDeviation') === '19.8'
      })
      assert.ok(
        color(await page.locator('#composer').evaluate(element => getComputedStyle(element).backgroundColor)).a > 0.65,
      )
      await page.emulateMedia({ contrast: 'no-preference' })
      await settle(page, 10)
      assert.equal((await surfaces(page)).composer?.kind, 'composer')
    } finally {
      await close()
    }
  })
  it('resumes when forced colors are cleared, including when enabled during forced colors', async () => {
    const { page, close } = await openFixture()
    try {
      for (const toggle of [false, true]) {
        await page.emulateMedia({ forcedColors: 'active' })
        await settle(page)
        if (toggle) {
          await page.evaluate(() => window.__fixture.form.update({ enabled: false }))
          await page.evaluate(() => window.__fixture.form.update({ enabled: true }))
        }
        assert.equal(await page.evaluate(() => window.__fixture.debug().diagnostics().running), false)
        await page.emulateMedia({ forcedColors: 'none' })
        await settle(page)
        assert.equal((await surfaces(page)).composer?.kind, 'composer')
      }
      await page.evaluate(() => window.__fixture.dispose())
      await page.emulateMedia({ forcedColors: 'active' })
      await page.emulateMedia({ forcedColors: 'none' })
      await settle(page)
      assert.equal(await page.locator('[data-glassui]').count(), 0)
    } finally {
      await close()
    }
  })

  it('removes marks from a detached surface before it is reused while disabled', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => {
        window.savedComposer = document.getElementById('composer')
        window.savedComposer.remove()
      })
      await settle(page)
      await page.evaluate(() => window.__fixture.form.update({ enabled: false }))
      await page.evaluate(() => document.body.append(window.savedComposer))
      await settle(page)
      assert.equal(await page.locator('[data-glassui-surface], [data-glassui-echo], [data-glassui-lens]').count(), 0)
    } finally {
      await close()
    }
  })
  it('applies live edits from DSH’s settings form', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => window.__fixture.form.update({ tint: 80, sidebar: 'docked', wallpaper: 'none' }))
      await settle(page)
      const state = await page.evaluate(() => ({
        tint: document.documentElement.style.getPropertyValue('--glassui-t'),
        sidebar: document.documentElement.getAttribute('data-glassui-sidebar'),
        wallpaper: document.documentElement.getAttribute('data-glassui-wallpaper'),
        clip: getComputedStyle(document.getElementById('sidebar')).clipPath,
      }))
      assert.deepEqual(state, { tint: '0.8', sidebar: 'docked', wallpaper: null, clip: 'none' })
    } finally {
      await close()
    }
  })

  it('keeps code blocks solid when asked to', async () => {
    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => window.__fixture.form.update({ codeBlocks: 'solid' }))
      await settle(page, 10)
      const found = await surfaces(page)
      assert.equal(found.code, undefined)
      assert.equal(found['code-banner'], undefined)
      assert.equal(
        await page.evaluate(() => document.querySelectorAll('[data-glassui-echo]').length),
        0,
        'echoes go with their surface',
      )
      assert.equal(found.composer?.kind, 'composer', 'everything else stays glass')
      const code = await page.evaluate(() => getComputedStyle(document.getElementById('code')).backgroundColor)
      assert.equal(code, 'rgb(245, 246, 247)', 'exactly DSH’s color, not nudged')
      await page.evaluate(() => window.__fixture.form.update({ codeBlocks: 'glass' }))
      await settle(page, 10)
      assert.equal((await surfaces(page)).code?.kind, 'code', 'and back')
    } finally {
      await close()
    }
  })

  it('turns off without leaving a trace', async () => {
    const stock = await openFixture({ plugin: false })
    const baseline = await snapshot(stock.page)
    await stock.close()

    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => window.__fixture.form.update({ enabled: false }))
      await settle(page)
      assert.equal(await page.evaluate(selector => document.querySelectorAll(selector).length, FOOTPRINT), 0)
      assert.deepEqual(await snapshot(page), baseline)
      await page.evaluate(() => window.__fixture.form.update({ enabled: true }))
      await settle(page)
      assert.equal((await surfaces(page)).composer?.kind, 'composer', 'and back on')
    } finally {
      await close()
    }
  })

  it('cleans up completely when DSH disposes the plugin', async () => {
    const stock = await openFixture({ plugin: false })
    const baseline = await snapshot(stock.page)
    await stock.close()

    const { page, close } = await openFixture()
    try {
      await page.evaluate(() => window.__fixture.dispose())
      await settle(page)
      assert.equal(await page.evaluate(selector => document.querySelectorAll(selector).length, FOOTPRINT), 0)
      assert.equal(await page.evaluate(() => '__DSH_GLASSUI_DEBUG__' in window), false)
      assert.deepEqual(await snapshot(page), baseline)
    } finally {
      await close()
    }
  })

  it('starts from the boot settings without a settings form', async () => {
    const { page, close } = await openFixture({ start: false, config: { tint: 10 } })
    try {
      await page.evaluate(() => window.__fixture.start({ form: false }))
      await settle(page)
      assert.equal(await page.evaluate(() => window.__fixture.debug().settings().tint), 10)
      assert.equal((await surfaces(page)).composer?.kind, 'composer')
    } finally {
      await close()
    }
  })
})

describe('performance', () => {
  it('keeps up with a streaming transcript', async () => {
    const { page, close } = await openFixture()
    try {
      const result = await page.evaluate(async () => {
        const chat = document.getElementById('chat')
        const before = window.__fixture.debug().diagnostics().scans
        let rows = 0
        // 4,000 messages arriving 200 per frame, each a row wrapping rendered Markdown, like DSH's transcript.
        for (let batch = 0; batch < 20; batch++) {
          const fragment = document.createDocumentFragment()
          for (let index = 0; index < 200; index++) {
            const row = document.createElement('div')
            row.innerHTML =
              '<div data-markdown-variant="message"><p>Line <b>bold</b> <code>code</code></p>' +
              '<ul><li>a</li><li>b</li></ul><pre><code>x = 1</code></pre><table><tr><td>1</td></tr></table></div>'
            fragment.append(row)
            rows++
          }
          chat.append(fragment)
          await window.__fixture.frames(1)
        }
        await window.__fixture.frames(30)
        const after = window.__fixture.debug().diagnostics().scans
        return {
          rows,
          nodes: chat.querySelectorAll('*').length,
          inspected: after.inspected - before.inspected,
          totalMs: after.totalMs - before.totalMs,
        }
      })
      assert.ok(result.nodes > 50_000, `${result.nodes} nodes`)
      // Rows and the <div>s of their Markdown (where code blocks live) are inspected;
      // text, lists, code and tables never are.
      assert.ok(result.inspected <= result.rows * 2 + 50, `inspected ${result.inspected} of ${result.nodes} nodes`)
      // Generous bound for slow CI runners; includes the style recalculation the browser needs anyway.
      assert.ok(result.totalMs / result.rows < 0.25, `${(result.totalMs / result.rows).toFixed(3)} ms per message`)
      assert.equal((await surfaces(page)).composer?.kind, 'composer')
    } finally {
      await close()
    }
  })
})
