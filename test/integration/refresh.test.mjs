import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { closeBrowser, openFixture, settle, surfaces } from './fixture.mjs'

after(closeBrowser)

describe('style and viewport refreshes', () => {
  it('updates sidebar geometry when only a media query changes its width', async () => {
    const { page, errors, close } = await openFixture({ config: { refraction: false } })
    try {
      await page.addStyleTag({ content: '@media (max-width: 800px) { .sidebar { width: 100px; } }' })
      await settle(page)
      assert.equal((await surfaces(page)).sidebar.float, true)
      await page.setViewportSize({ width: 700, height: 900 })
      await settle(page, 12)
      assert.equal((await surfaces(page)).sidebar.float, false)
      assert.equal(await page.locator('#sidebar').evaluate(el => getComputedStyle(el).clipPath), 'none')
      await page.setViewportSize({ width: 1440, height: 900 })
      await settle(page, 12)
      assert.equal((await surfaces(page)).sidebar.float, true)
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('releases and restores refraction as responsive panels cross the area limit', async () => {
    const { page, errors, close } = await openFixture()
    try {
      await page.addStyleTag({ content: '@media (max-width: 800px) { .dialog { width: 90vw; height: 80vh; } }' })
      await settle(page)
      assert.notEqual((await surfaces(page)).dialog.lens, null)
      await page.setViewportSize({ width: 700, height: 900 })
      await settle(page, 12)
      assert.equal((await surfaces(page)).dialog.lens, null, 'large panels keep blur without a full-size lens map')
      await page.setViewportSize({ width: 1440, height: 900 })
      await settle(page, 12)
      assert.notEqual((await surfaces(page)).dialog.lens, null)
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('discovers and removes glass when a stylesheet changes elevation without changing tokens', async () => {
    const { page, errors, close } = await openFixture({ config: { refraction: false } })
    try {
      assert.equal((await surfaces(page))['flat-card'], undefined)
      const style = await page.addStyleTag({ content: '.flat-card { box-shadow: var(--dsw-elevation-panel); }' })
      await settle(page, 12)
      assert.equal((await surfaces(page))['flat-card']?.kind, 'panel')
      await style.evaluate(el => (el.textContent = '.flat-card { box-shadow: none; }'))
      await settle(page, 12)
      assert.equal((await surfaces(page))['flat-card'], undefined)
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('discovers panels when an external stylesheet finishes loading', async () => {
    const { page, errors, close } = await openFixture({ config: { refraction: false } })
    try {
      await page.evaluate(async () => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        const loaded = new Promise(resolve => link.addEventListener('load', resolve, { once: true }))
        link.href = 'data:text/css,' + encodeURIComponent('.flat-card { box-shadow: var(--dsw-elevation-panel); }')
        document.head.append(link)
        await loaded
      })
      await settle(page, 12)
      assert.equal((await surfaces(page))['flat-card']?.kind, 'panel')
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('rejects final fill collisions with reserved colors after inline theme overrides', async () => {
    const { page, errors, close } = await openFixture({
      config: { refraction: false },
      extraBody:
        '<div id="reserved" style="background:var(--dsw-specific-selector);width:200px;height:100px">Selector</div>',
    })
    try {
      await page.evaluate(() => document.body.style.setProperty('--dsw-specific-input-major', '#fff'))
      await settle(page, 12)
      assert.equal((await surfaces(page)).reserved, undefined)
      assert.equal((await surfaces(page)).composer, undefined, 'ambiguous fills are left alone')
      assert.ok((await page.evaluate(() => window.__fixture.debug().diagnostics())).ambiguousTokens.includes('input'))
      await page.evaluate(() => document.body.style.removeProperty('--dsw-specific-input-major'))
      await settle(page, 12)
      assert.equal((await surfaces(page)).composer?.kind, 'composer')
      assert.equal((await surfaces(page)).reserved, undefined)
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('discovers menus opened after changing tint without a palette refresh', async () => {
    const { page, errors, close } = await openFixture({ config: { refraction: false } })
    try {
      await page.evaluate(() => window.__fixture.form.update({ tint: 80 }))
      await settle(page, 12)
      await page.evaluate(() => {
        const menu = document.createElement('div')
        menu.id = 'late-menu'
        menu.className = 'menu'
        document.body.append(menu)
      })
      await settle(page, 12)
      assert.equal((await surfaces(page))['late-menu']?.kind, 'menu')
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })
})

async function appearance(page, ids) {
  return page.evaluate(
    ids =>
      Object.fromEntries(
        ids.map(id => {
          const style = getComputedStyle(document.getElementById(id))
          return [id, [style.backgroundColor, style.boxShadow, style.backdropFilter]]
        }),
      ),
    ids,
  )
}

describe('opt-out appearance', () => {
  it('preserves upstream fills, shadows and menu filters across palette and tint changes', async () => {
    const ids = ['dialog', 'menu', 'ignored-dialog']
    const stock = await openFixture({ plugin: false })
    const { page, errors, close } = await openFixture({ config: { exclude: '#dialog, .menu' } })
    try {
      assert.deepEqual(await appearance(page, ids), await appearance(stock.page, ids))
      for (const target of [stock.page, page]) {
        await target.evaluate(() => {
          document.body.setAttribute('data-ds-dark-theme', '')
          document.body.style.setProperty('--dsw-menu-surface-fill', 'rgb(40 50 60 / 0.9)')
        })
      }
      // Finish the palette read before changing tint, so a later palette refresh
      // cannot accidentally mask an outdated menu-filter signature.
      await settle(page, 12)
      await page.evaluate(() => window.__fixture.form.update({ tint: 80 }))
      await settle(page, 12)
      assert.deepEqual(await appearance(page, ids), await appearance(stock.page, ids))
      await page.evaluate(() => window.__fixture.form.update({ exclude: '' }))
      await settle(page, 12)
      assert.equal((await surfaces(page)).dialog?.kind, 'panel')
      assert.equal((await surfaces(page)).menu?.kind, 'menu')
      assert.deepEqual(errors, [])
    } finally {
      await close()
      await stock.close()
    }
  })

  it('restores inherited fills inside glass while respecting component overrides', async () => {
    const extraBody =
      '<div class="composer" style="top:450px;width:200px;height:100px">' +
      '<div id="opt-out" data-glassui-ignore style="background:var(--dsw-specific-input-major);height:40px">Ignored</div>' +
      '<div id="custom" data-glassui-ignore style="--dsw-specific-input-major:rgb(12 34 56);background:var(--dsw-specific-input-major)">Custom</div>' +
      '</div>'
    const ids = ['opt-out', 'custom']
    const stock = await openFixture({ plugin: false, extraBody })
    const { page, errors, close } = await openFixture({ extraBody })
    try {
      assert.deepEqual(await appearance(page, ids), await appearance(stock.page, ids))
      await page.locator('#opt-out').evaluate(el => el.removeAttribute('data-glassui-ignore'))
      await settle(page, 12)
      assert.equal(await page.locator('#opt-out').getAttribute('data-glassui-excluded'), null)
      await page.locator('#opt-out').evaluate(el => el.setAttribute('data-glassui-ignore', ''))
      await settle(page, 12)
      assert.deepEqual(await appearance(page, ids), await appearance(stock.page, ids))
      await page.evaluate(() => window.__fixture.form.update({ enabled: false }))
      await settle(page)
      assert.equal(await page.locator('[data-glassui-excluded]').count(), 0)
      assert.deepEqual(errors, [])
    } finally {
      await close()
      await stock.close()
    }
  })
})
