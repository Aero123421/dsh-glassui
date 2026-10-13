import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { closeBrowser, openFixture, settle, surfaces } from './fixture.mjs'

after(closeBrowser)
const background = (page, id = 'inline-code') =>
  page.locator(`#${id}`).evaluate(el => getComputedStyle(el).backgroundColor)

describe('inline-code material', () => {
  it('updates opacity independently, respects theme overrides and restores stock on disable', async () => {
    const stock = await openFixture({ plugin: false })
    const f = await openFixture()
    try {
      const { page } = f
      for (const dark of [false, true]) {
        await page.evaluate(dark => document.body.toggleAttribute('data-ds-dark-theme', dark), dark)
        await settle(page, 12)
        for (const inlineCodeOpacity of [0, 18, 72, 100]) {
          await page.evaluate(
            inlineCodeOpacity => window.__fixture.form.update({ inlineCodeOpacity }),
            inlineCodeOpacity,
          )
          const before = await background(page)
          await page.evaluate(() => window.__fixture.form.update({ tint: 0 }))
          assert.equal(await background(page), before)
          await page.evaluate(() => window.__fixture.form.update({ tint: 100 }))
          assert.equal(await background(page), before)
          assert.equal(
            await page.evaluate(() => window.__fixture.debug().settings().inlineCodeOpacity),
            inlineCodeOpacity,
          )
        }
      }
      await page.evaluate(() => document.body.style.setProperty('--dsw-alias-markdown-inline-code', 'rgb(12 34 56)'))
      await settle(page, 12)
      assert.equal(await background(page), 'rgb(12, 34, 56)')
      await page.evaluate(() => window.__fixture.form.update({ inlineCodeOpacity: 10 }))
      assert.equal(await background(page), 'rgb(12, 34, 56)')
      await page.evaluate(() => {
        document.body.style.removeProperty('--dsw-alias-markdown-inline-code')
        document.body.removeAttribute('data-ds-dark-theme')
        window.__fixture.form.update({ enabled: false })
      })
      assert.equal(await background(page), await background(stock.page))
      assert.equal(
        await page.evaluate(() => document.documentElement.style.getPropertyValue('--glassui-inline-opacity')),
        '',
      )
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
      await stock.close()
    }
  })

  it('keeps original tokens at dynamic exclusions, including moves and arbitrary selectors', async () => {
    const f = await openFixture()
    try {
      const { page } = f
      await page.evaluate(() => {
        const wrapper = document.createElement('div')
        wrapper.id = 'inline-wrapper'
        wrapper.setAttribute('data-glassui-ignore', '')
        document.getElementById('main').append(wrapper)
        wrapper.append(document.getElementById('inline-code'))
      })
      await settle(page, 12)
      assert.equal(await background(page), 'rgb(240, 241, 243)')
      await page.evaluate(() => document.getElementById('inline-wrapper').removeAttribute('data-glassui-ignore'))
      await settle(page, 12)
      assert.equal(await background(page), 'rgba(245, 246, 248, 0.72)')
      await page.evaluate(() => window.__fixture.form.update({ exclude: '#inline-wrapper:has(.marker)' }))
      await page.evaluate(() => {
        const marker = document.createElement('span')
        marker.className = 'marker'
        document.getElementById('inline-wrapper').append(marker)
      })
      await settle(page, 12)
      assert.equal(await background(page), 'rgb(240, 241, 243)')
      await page.evaluate(() => document.querySelector('.marker').remove())
      await settle(page, 12)
      assert.equal(await background(page), 'rgba(245, 246, 248, 0.72)')
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

  it('honors contrast, reduced transparency and forced colors', async () => {
    const f = await openFixture({ config: { inlineCodeOpacity: 0 } })
    try {
      const cdp = await f.page.context().newCDPSession(f.page)
      for (const [name, alpha] of [
        ['prefers-contrast', '0.85'],
        ['prefers-reduced-transparency', '1'],
      ]) {
        await cdp.send('Emulation.setEmulatedMedia', {
          features: [{ name, value: name === 'prefers-contrast' ? 'more' : 'reduce' }],
        })
        await settle(f.page, 12)
        assert.equal(
          await f.page.evaluate(
            name => matchMedia(`(${name}: ${name === 'prefers-contrast' ? 'more' : 'reduce'})`).matches,
            name,
          ),
          true,
        )
        const value = await background(f.page)
        assert.equal(value, alpha === '1' ? 'rgb(245, 246, 248)' : 'rgba(245, 246, 248, 0.85)')
      }
      await f.page.emulateMedia({ forcedColors: 'active' })
      await settle(f.page, 12)
      assert.equal(await f.page.getAttribute('html', 'data-glassui'), null)
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })
})

describe('synchronous density updates and streaming', () => {
  it('applies all 101 values and blur without forced style/geometry reads, then discovers new menus', async () => {
    const f = await openFixture()
    try {
      await settle(f.page, 20)
      await f.page.waitForTimeout(200)
      const results = await f.page.evaluate(() => {
        const read = window.getComputedStyle
        let reads = 0
        window.getComputedStyle = function (...args) {
          reads++
          return read.apply(this, args)
        }
        const values = []
        for (let tint = 0; tint <= 100; tint++) {
          window.__fixture.form.update({ tint })
          values.push(document.documentElement.style.getPropertyValue('--glassui-t'))
          for (const blur of document.querySelectorAll('feGaussianBlur'))
            if (blur.getAttribute('stdDeviation') !== ((6 + (tint / 100) * 22) * 0.8).toFixed(1))
              throw Error('blur did not update')
        }
        window.getComputedStyle = read
        const menu = document.createElement('div')
        menu.id = 'late-menu'
        menu.className = 'menu'
        document.body.append(menu)
        return { reads, values }
      })
      assert.equal(results.reads, 0)
      assert.deepEqual(
        results.values,
        Array.from({ length: 101 }, (_, i) => String(i / 100)),
      )
      await settle(f.page, 12)
      assert.equal((await surfaces(f.page))['late-menu']?.kind, 'menu')
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

  it('does not scan the whole document to preserve opt-outs on each transcript row', async () => {
    const f = await openFixture()
    try {
      const count = await f.page.evaluate(async () => {
        const query = Document.prototype.querySelectorAll
        let calls = 0
        Document.prototype.querySelectorAll = function (...args) {
          calls++
          return query.apply(this, args)
        }
        for (let i = 0; i < 20; i++) {
          const p = document.createElement('p')
          p.textContent = `Streaming ${i}`
          document.getElementById('chat').append(p)
          await window.__fixture.frames(2)
        }
        Document.prototype.querySelectorAll = query
        return calls
      })
      assert.equal(count, 0)
      assert.equal((await f.page.locator('#ignored').getAttribute('data-glassui-excluded')) !== null, true)
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })
})

describe('pointer highlight ordering', () => {
  it('reads nested surface geometry before writes and skips identical coordinate writes', async () => {
    const f = await openFixture({ config: { refraction: false } })
    try {
      await f.page.evaluate(() => {
        const pane = document.createElement('div')
        pane.id = 'nested-composer'
        pane.className = 'composer'
        pane.style.cssText = 'position:relative;left:0;right:auto;bottom:auto;width:160px;height:80px'
        document.getElementById('dialog').append(pane)
      })
      await settle(f.page, 12)
      const log = await f.page.evaluate(async () => {
        const entries = []
        const read = Element.prototype.getBoundingClientRect
        const write = CSSStyleDeclaration.prototype.setProperty
        Element.prototype.getBoundingClientRect = function (...args) {
          if (this.hasAttribute('data-glassui-surface')) entries.push('read')
          return read.apply(this, args)
        }
        CSSStyleDeclaration.prototype.setProperty = function (name, ...args) {
          if (name === '--glassui-lx' || name === '--glassui-ly') entries.push('write')
          return write.call(this, name, ...args)
        }
        try {
          const pane = document.getElementById('nested-composer')
          pane.dispatchEvent(
            new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 450, clientY: 110 }),
          )
          await window.__fixture.frames(2)
          const first = [...entries]
          entries.length = 0
          pane.dispatchEvent(
            new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 450, clientY: 110 }),
          )
          await window.__fixture.frames(2)
          return {
            first,
            second: entries,
            x: pane.style.getPropertyValue('--glassui-lx'),
            y: pane.style.getPropertyValue('--glassui-ly'),
          }
        } finally {
          Element.prototype.getBoundingClientRect = read
          CSSStyleDeclaration.prototype.setProperty = write
        }
      })
      assert.deepEqual(log.first, ['read', 'read', 'write', 'write', 'write', 'write'])
      assert.deepEqual(log.second, ['read', 'read'])
      assert.ok(log.x.endsWith('px') && log.y.endsWith('px'))
      await f.page.evaluate(() => window.__fixture.form.update({ enabled: false }))
      assert.equal(
        await f.page.locator('#nested-composer').evaluate(el => el.style.getPropertyValue('--glassui-lx')),
        '',
      )
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })
})
