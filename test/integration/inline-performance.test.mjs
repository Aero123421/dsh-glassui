import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { closeBrowser, openFixture, settle, surfaces } from './fixture.mjs'
import { parseColor } from '../../src/shared/color.ts'

after(closeBrowser)
const background = (page, id = 'inline-code') =>
  page.locator(`#${id}`).evaluate(el => getComputedStyle(el).backgroundColor)

describe('inline-code material', () => {
  it('enforces the final opacity floor on chrome, code, menus and explicit materials', async () => {
    const f = await openFixture({ extraBody: '<div id="explicit" data-glassui-material="regular">Material</div>' })
    try {
      const cdp = await f.page.context().newCDPSession(f.page)
      for (const dark of [false, true]) {
        await f.page.evaluate(dark => document.body.toggleAttribute('data-ds-dark-theme', dark), dark)
        for (const [name, value, floor] of [
          ['prefers-contrast', 'more', 0.85],
          ['prefers-reduced-transparency', 'reduce', 1],
        ]) {
          await cdp.send('Emulation.setEmulatedMedia', { features: [{ name, value }] })
          await settle(f.page, 20)
          for (const id of ['sidebar', 'composer', 'dialog', 'code', 'menu', 'inline-code', 'explicit']) {
            const color = await background(f.page, id)
            assert.ok(parseColor(color)?.a >= floor, `${id} ${dark ? 'dark' : 'light'}: ${color}, floor ${floor}`)
          }
        }
      }
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

  it('tracks exclusion selectors when only data-state, aria-expanded or id changes', async () => {
    const f = await openFixture({ config: { exclude: '[data-state="open"], [aria-expanded="true"], #leave-alone' } })
    try {
      for (const [attribute, value] of [
        ['data-state', 'open'],
        ['aria-expanded', 'true'],
        ['id', 'leave-alone'],
      ]) {
        await f.page
          .locator('.dialog')
          .filter({ hasText: 'Dialog' })
          .first()
          .evaluate((element, args) => element.setAttribute(...args), [attribute, value])
        await settle(f.page, 20)
        const state = await f.page
          .locator('.dialog')
          .filter({ hasText: 'Dialog' })
          .first()
          .evaluate(element => ({
            marker: element.hasAttribute('data-glassui-excluded'),
            surface: element.hasAttribute('data-glassui-surface'),
            blur: getComputedStyle(element).backdropFilter,
          }))
        assert.deepEqual(state, { marker: true, surface: false, blur: 'none' })
        await f.page
          .locator('.dialog')
          .filter({ hasText: 'Dialog' })
          .first()
          .evaluate((element, attribute) => {
            element.removeAttribute(attribute)
            element.id = 'dialog'
          }, attribute)
        await settle(f.page, 20)
        assert.equal((await surfaces(f.page)).dialog?.kind, 'panel')
      }
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

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
        const material = await f.page.evaluate(() => ({
          filter: getComputedStyle(document.documentElement).getPropertyValue('--glassui-filter').trim(),
          backdrop: getComputedStyle(document.getElementById('composer')).backdropFilter,
        }))
        if (name === 'prefers-reduced-transparency') {
          assert.equal(material.filter, 'none')
          assert.equal(material.backdrop, 'none')
        } else {
          assert.match(material.filter, /blur/)
          assert.match(material.backdrop, /blur|url/)
        }
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
      assert.deepEqual(log.second, [])
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

  it('measures again after scroll or a layout change, and ignores touch', async () => {
    const f = await openFixture({ config: { refraction: false } })
    try {
      await f.page.evaluate(() => {
        const pane = document.createElement('div')
        pane.id = 'nested-composer'
        pane.className = 'composer'
        pane.style.cssText = 'position:relative;left:0;right:auto;bottom:auto;width:160px;height:80px'
        document.getElementById('dialog').append(pane)
        const chat = document.getElementById('chat')
        chat.style.overflow = 'auto'
        chat.style.height = '80px'
        const spacer = document.createElement('div')
        spacer.style.height = '400px'
        chat.append(spacer)
      })
      await settle(f.page, 12)
      const log = await f.page.evaluate(async () => {
        const entries = []
        const read = Element.prototype.getBoundingClientRect
        Element.prototype.getBoundingClientRect = function (...args) {
          if (this.hasAttribute('data-glassui-surface')) entries.push('read')
          return read.apply(this, args)
        }
        const move = (type, x, y) => {
          document
            .getElementById('nested-composer')
            .dispatchEvent(
              new PointerEvent('pointermove', { bubbles: true, pointerType: type, clientX: x, clientY: y }),
            )
        }
        try {
          move('mouse', 450, 110)
          await window.__fixture.frames(2)
          entries.length = 0
          move('touch', 460, 120)
          await window.__fixture.frames(2)
          const touch = [...entries]
          entries.length = 0
          document.getElementById('chat').scrollTop = 40
          move('mouse', 450, 110)
          await window.__fixture.frames(2)
          const scrolled = [...entries]
          entries.length = 0
          move('mouse', 452, 112)
          await window.__fixture.frames(2)
          const cached = [...entries]
          entries.length = 0
          document.getElementById('nested-composer').style.marginLeft = '24px'
          move('mouse', 452, 112)
          await window.__fixture.frames(2)
          const shifted = [...entries]
          entries.length = 0
          const motion = document
            .getElementById('nested-composer')
            .animate([{ transform: 'none' }, { transform: 'translateX(8px)' }], {
              duration: 5000,
            })
          move('mouse', 460, 116)
          await window.__fixture.frames(2)
          const animated = [...entries]
          motion.cancel()
          return { touch, scrolled, cached, shifted, animated }
        } finally {
          Element.prototype.getBoundingClientRect = read
        }
      })
      assert.deepEqual(log.touch, [])
      assert.ok(log.scrolled.includes('read'), `scroll should measure, got ${log.scrolled.join(',')}`)
      assert.deepEqual(log.cached, [])
      assert.ok(log.shifted.includes('read'), `layout change should measure, got ${log.shifted.join(',')}`)
      assert.ok(log.animated.includes('read'), `animation should measure, got ${log.animated.join(',')}`)
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

  it('drops the position cache for font, image, text, and attribute changes', async () => {
    const f = await openFixture({ config: { refraction: false } })
    try {
      await f.page.evaluate(() => {
        const host = document.createElement('div')
        host.id = 'flow-host'
        host.style.cssText = 'position:relative;width:80px'
        const above = document.createElement('div')
        above.id = 'flow-above'
        above.textContent = 'a'
        const pane = document.createElement('div')
        pane.id = 'flow-pane'
        pane.className = 'composer'
        pane.style.cssText = 'position:relative;left:auto;right:auto;bottom:auto;width:70px;height:36px'
        host.append(above, pane)
        document.getElementById('dialog').append(host)
      })
      await settle(f.page, 12)
      const log = await f.page.evaluate(async () => {
        const entries = []
        const read = Element.prototype.getBoundingClientRect
        Element.prototype.getBoundingClientRect = function (...args) {
          if (this.id === 'flow-pane') entries.push('read')
          return read.apply(this, args)
        }
        const pane = document.getElementById('flow-pane')
        const move = () => {
          pane.dispatchEvent(
            new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 450, clientY: 140 }),
          )
        }
        const placed = () => {
          const rect = read.call(pane)
          return `${Math.round(140 - rect.top - pane.clientTop)}px`
        }
        try {
          move()
          await window.__fixture.frames(2)
          entries.length = 0
          pane.setAttribute('title', 'label')
          move()
          await window.__fixture.frames(2)
          const titled = [...entries]
          const titleY = pane.style.getPropertyValue('--glassui-ly')
          entries.length = 0
          const image = document.createElement('img')
          document.body.append(image)
          move()
          await window.__fixture.frames(2)
          entries.length = 0
          image.dispatchEvent(new Event('load'))
          move()
          await window.__fixture.frames(2)
          const loaded = [...entries]
          entries.length = 0
          move()
          await window.__fixture.frames(2)
          entries.length = 0
          document.fonts.dispatchEvent(new Event('loadingdone'))
          move()
          await window.__fixture.frames(2)
          const fonts = [...entries]
          entries.length = 0
          move()
          await window.__fixture.frames(2)
          entries.length = 0
          const before = placed()
          document.getElementById('flow-above').firstChild.data = 'word '.repeat(30)
          await window.__fixture.frames(2)
          move()
          await window.__fixture.frames(2)
          return {
            titled,
            titleY,
            loaded,
            fonts,
            shifted: [...entries],
            before,
            after: pane.style.getPropertyValue('--glassui-ly'),
            expected: placed(),
          }
        } finally {
          Element.prototype.getBoundingClientRect = read
        }
      })
      assert.ok(log.titled.includes('read'), `attribute change should measure, got ${log.titled.join(',')}`)
      assert.ok(log.titleY.endsWith('px'))
      assert.ok(log.loaded.includes('read'), `image load should measure, got ${log.loaded.join(',')}`)
      assert.ok(log.fonts.includes('read'), `font load should measure, got ${log.fonts.join(',')}`)
      assert.ok(log.shifted.includes('read'), `text reflow should measure, got ${log.shifted.join(',')}`)
      assert.notEqual(log.before, log.expected)
      assert.equal(log.after, log.expected)
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

  it('drops the position cache when text changes inside a fixed-size container', async () => {
    const f = await openFixture({ config: { refraction: false } })
    try {
      const log = await f.page.evaluate(async () => {
        const host = document.createElement('div')
        host.id = 'fixed-host'
        host.style.cssText = 'position:relative;width:200px;height:160px;overflow:hidden'
        const copy = document.createElement('div')
        copy.id = 'fixed-copy'
        copy.style.cssText = 'font:20px/20px sans-serif;white-space:pre'
        copy.textContent = 'a'
        const pane = document.createElement('div')
        pane.id = 'fixed-pane'
        pane.className = 'composer'
        pane.style.cssText = 'position:relative;left:0;right:auto;bottom:auto;width:80px;height:36px;margin:0'
        host.append(copy, pane)
        document.getElementById('dialog').append(host)
        await window.__fixture.frames(2)
        const read = Element.prototype.getBoundingClientRect
        const entries = []
        Element.prototype.getBoundingClientRect = function (...args) {
          if (this.id === 'fixed-pane') entries.push('read')
          return read.apply(this, args)
        }
        const move = () => {
          pane.dispatchEvent(
            new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 30, clientY: 30 }),
          )
        }
        const placed = () => {
          const rect = read.call(pane)
          return `${Math.round(30 - rect.top - pane.clientTop)}px`
        }
        try {
          move()
          await window.__fixture.frames(2)
          const before = pane.style.getPropertyValue('--glassui-ly')
          entries.length = 0
          copy.firstChild.data = 'line\n'.repeat(6)
          await window.__fixture.frames(2)
          move()
          await window.__fixture.frames(2)
          return { before, after: pane.style.getPropertyValue('--glassui-ly'), expected: placed(), reads: [...entries] }
        } finally {
          Element.prototype.getBoundingClientRect = read
        }
      })
      assert.ok(log.reads.includes('read'), `fixed-container text should measure, got ${log.reads.join(',')}`)
      assert.ok(
        Math.abs(Number.parseFloat(log.after) - Number.parseFloat(log.before)) >= 70,
        `${log.before} -> ${log.after}`,
      )
      assert.equal(log.after, log.expected)
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

  it('drops the position cache when data-state or aria-expanded changes', async () => {
    const f = await openFixture({ config: { refraction: false } })
    try {
      const log = await f.page.evaluate(async () => {
        const style = document.createElement('style')
        style.textContent =
          '#state-pane[data-state="open"]{margin-top:96px !important}#state-pane[aria-expanded="true"]{margin-left:88px !important}'
        document.head.append(style)
        const pane = document.createElement('div')
        pane.id = 'state-pane'
        pane.className = 'composer'
        pane.setAttribute('data-state', 'closed')
        pane.style.cssText = 'position:relative;left:0;right:auto;bottom:auto;width:80px;height:36px;margin:0'
        document.getElementById('dialog').append(pane)
        await window.__fixture.frames(2)
        const read = Element.prototype.getBoundingClientRect
        const entries = []
        Element.prototype.getBoundingClientRect = function (...args) {
          if (this.id === 'state-pane') entries.push('read')
          return read.apply(this, args)
        }
        const move = (x, y) => {
          pane.dispatchEvent(
            new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: x, clientY: y }),
          )
        }
        const placed = (x, y) => {
          const rect = read.call(pane)
          return {
            x: `${Math.round(x - rect.left - pane.clientLeft)}px`,
            y: `${Math.round(y - rect.top - pane.clientTop)}px`,
          }
        }
        try {
          move(40, 40)
          await window.__fixture.frames(2)
          const beforeY = pane.style.getPropertyValue('--glassui-ly')
          entries.length = 0
          pane.setAttribute('data-state', 'open')
          await window.__fixture.frames(2)
          move(40, 40)
          await window.__fixture.frames(2)
          const opened = {
            reads: [...entries],
            y: pane.style.getPropertyValue('--glassui-ly'),
            expected: placed(40, 40).y,
          }
          const beforeX = pane.style.getPropertyValue('--glassui-lx')
          entries.length = 0
          pane.setAttribute('aria-expanded', 'true')
          await window.__fixture.frames(2)
          move(40, 40)
          await window.__fixture.frames(2)
          return {
            beforeY,
            opened,
            beforeX,
            expanded: {
              reads: [...entries],
              x: pane.style.getPropertyValue('--glassui-lx'),
              expected: placed(40, 40).x,
            },
          }
        } finally {
          Element.prototype.getBoundingClientRect = read
        }
      })
      assert.ok(log.opened.reads.includes('read'), `data-state should measure, got ${log.opened.reads.join(',')}`)
      assert.ok(
        Math.abs(Number.parseFloat(log.opened.y) - Number.parseFloat(log.beforeY)) >= 70,
        `${log.beforeY} -> ${log.opened.y}`,
      )
      assert.equal(log.opened.y, log.opened.expected)
      assert.ok(
        log.expanded.reads.includes('read'),
        `aria-expanded should measure, got ${log.expanded.reads.join(',')}`,
      )
      assert.ok(
        Math.abs(Number.parseFloat(log.expanded.x) - Number.parseFloat(log.beforeX)) >= 70,
        `${log.beforeX} -> ${log.expanded.x}`,
      )
      assert.equal(log.expanded.x, log.expanded.expected)
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

  it('drops the position cache when the first size observation disagrees with the measured box', async () => {
    const f = await openFixture({ config: { refraction: false } })
    try {
      const log = await f.page.evaluate(async () => {
        const pane = document.createElement('div')
        pane.id = 'size-pane'
        pane.className = 'composer'
        pane.style.cssText = 'position:relative;left:0;right:auto;bottom:auto;width:80px;height:36px;margin:0'
        document.getElementById('dialog').append(pane)
        await window.__fixture.frames(2)
        const read = Element.prototype.getBoundingClientRect
        const entries = []
        let fake = true
        Element.prototype.getBoundingClientRect = function (...args) {
          const rect = read.apply(this, args)
          if (this.id === 'size-pane') entries.push('read')
          if (fake && this.id === 'size-pane') return new DOMRect(rect.x, rect.y, rect.width + 90, rect.height)
          return rect
        }
        const move = () => {
          pane.dispatchEvent(
            new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 20, clientY: 20 }),
          )
        }
        try {
          move()
          await window.__fixture.frames(2)
          fake = false
          entries.length = 0
          move()
          await window.__fixture.frames(2)
          const rect = read.call(pane)
          return {
            reads: [...entries],
            y: pane.style.getPropertyValue('--glassui-ly'),
            expected: `${Math.round(20 - rect.top - pane.clientTop)}px`,
          }
        } finally {
          Element.prototype.getBoundingClientRect = read
        }
      })
      assert.ok(log.reads.includes('read'), `size mismatch should measure, got ${log.reads.join(',')}`)
      assert.equal(log.y, log.expected)
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })

  it('still follows the pointer when document.fonts is missing', async () => {
    const f = await openFixture({ config: { refraction: false } })
    try {
      const log = await f.page.evaluate(async () => {
        const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'fonts')
        if (desc?.configurable !== true) return { configurable: false }
        Object.defineProperty(Document.prototype, 'fonts', { configurable: true, get: () => undefined })
        try {
          window.__fixture.form.update({ highlights: false })
          window.__fixture.form.update({ highlights: true })
        } finally {
          Object.defineProperty(Document.prototype, 'fonts', desc)
        }
        const pane = document.createElement('div')
        pane.id = 'fontless-pane'
        pane.className = 'composer'
        pane.style.cssText = 'position:relative;left:0;right:auto;bottom:auto;width:80px;height:36px'
        document.getElementById('dialog').append(pane)
        await window.__fixture.frames(2)
        pane.dispatchEvent(
          new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 24, clientY: 24 }),
        )
        await window.__fixture.frames(2)
        return { configurable: true, x: pane.style.getPropertyValue('--glassui-lx') }
      })
      assert.equal(log.configurable, true)
      assert.ok(log.x.endsWith('px'))
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })
})
