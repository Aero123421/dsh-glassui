// Refraction relies on how Chromium places SVG filters used in backdrop-filter.
// These tests pin that behavior, so a browser change shows up in CI before users see it.
import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { closeBrowser, openFixture, settle, surfaces } from './fixture.mjs'

after(closeBrowser)

/** Position of the first pure red pixel in a clip of the page, in CSS pixels relative to the clip. */
async function findRed(page, clip) {
  const png = (await page.screenshot({ clip })).toString('base64')
  return page.evaluate(async data => {
    const blob = await (await fetch(`data:image/png;base64,${data}`)).blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext('2d')
    context.drawImage(bitmap, 0, 0)
    const { data: pixels, width, height } = context.getImageData(0, 0, bitmap.width, bitmap.height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const k = (y * width + x) * 4
        if (pixels[k] > 240 && pixels[k + 1] < 15 && pixels[k + 2] < 15)
          return { x: x / devicePixelRatio, y: y / devicePixelRatio }
      }
    }
    return undefined
  }, png)
}

describe('refraction', () => {
  it('refracts the composer with a filter aligned to its box', async () => {
    const { page, close } = await openFixture()
    try {
      await settle(page, 20)
      await page.waitForTimeout(400)
      await settle(page)
      const found = await surfaces(page)
      assert.ok(found.composer?.lens, 'the composer refracts')
      const state = await page.evaluate(() => {
        const composer = document.getElementById('composer')
        const id = composer.getAttribute('data-glassui-lens')
        const filter = document.getElementById(`glassui-lens-${id}`)
        return {
          backdrop: getComputedStyle(composer).backdropFilter,
          shadow: getComputedStyle(composer).boxShadow,
          filter: filter && {
            x: filter.getAttribute('x'),
            y: filter.getAttribute('y'),
            width: filter.getAttribute('width'),
            primitives: [...filter.children].map(child => child.tagName),
          },
          width: composer.offsetWidth,
          lenses: window.__fixture.debug().diagnostics().lenses,
        }
      })
      assert.match(state.backdrop, /^url\("?#glassui-lens-\d+"?\)/)
      assert.deepEqual(state.filter.primitives, [
        'feGaussianBlur',
        'feFlood',
        'feImage',
        'feMerge',
        'feDisplacementMap',
      ])
      assert.equal(state.filter.width, String(state.width))
      assert.equal(Number(state.filter.x), 0, 'no version-dependent origin correction')
      assert.ok(state.lenses >= 1)
    } finally {
      await close()
    }
  })

  it('keeps the plain blur when refraction is off', async () => {
    const { page, close } = await openFixture({ config: { refraction: false } })
    try {
      await page.waitForTimeout(300)
      await settle(page)
      const found = await surfaces(page)
      assert.equal(found.composer?.lens, null)
      assert.equal(await page.evaluate(() => document.querySelectorAll('[data-glassui-owned="defs"] filter').length), 0)
    } finally {
      await close()
    }
  })

  it('keeps blur during an ancestor resize and reuses the lens when the drag settles', async () => {
    const { page, errors, close } = await openFixture()
    try {
      await page.waitForFunction(() =>
        getComputedStyle(document.getElementById('composer')).backdropFilter.startsWith('url('),
      )
      const id = await page.locator('#composer').getAttribute('data-glassui-lens')
      await page.evaluate(async () => {
        const main = document.getElementById('main')
        for (let index = 0; index < 12; index++) {
          await new Promise(resolve => requestAnimationFrame(resolve))
          main.style.width = `${800 - index * 10}px`
          main.style.flex = 'none'
        }
      })
      await page.waitForFunction(() =>
        getComputedStyle(document.getElementById('composer')).backdropFilter.startsWith('blur('),
      )
      assert.equal(await page.locator('#composer').getAttribute('data-glassui-lens'), id)
      await page.waitForFunction(() => {
        const element = document.getElementById('composer')
        const filter = document.getElementById(`glassui-lens-${element.getAttribute('data-glassui-lens')}`)
        return (
          getComputedStyle(element).backdropFilter.startsWith('url(') &&
          Number(filter?.getAttribute('width')) === element.offsetWidth
        )
      })
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('places the production filter at the border box without a shadow correction', async () => {
    const { page, close } = await openFixture()
    try {
      await page.waitForFunction(() =>
        getComputedStyle(document.getElementById('composer')).backdropFilter.startsWith('url('),
      )
      const box = await page.evaluate(() => {
        const element = document.getElementById('composer')
        const id = element.getAttribute('data-glassui-lens')
        const source = document.getElementById(`glassui-lens-${id}`)
        const filter = source.cloneNode(false)
        filter.id = 'production-canary'
        filter.setAttribute('width', '160')
        filter.setAttribute('height', '90')
        source.parentElement.append(filter)
        const probe = document.createElement('div')
        probe.style.cssText =
          'position:fixed;left:200px;top:200px;width:160px;height:90px;backdrop-filter:url(#production-canary)'
        probe.style.boxShadow = getComputedStyle(element).boxShadow
        // Read the actual material decorations without painting the composer's fill over the marker.
        probe.setAttribute('data-glassui-ignore', '')
        document.body.append(probe)
        const svg = 'http://www.w3.org/2000/svg'
        const flood = document.createElementNS(svg, 'feFlood')
        flood.setAttribute('flood-color', '#ff0000')
        for (const [key, value] of Object.entries({ x: 20, y: 10, width: 8, height: 8 }))
          flood.setAttribute(key, String(value))
        // Fill the full region, as the actual refraction filter does.
        const clear = document.createElementNS(svg, 'feFlood')
        clear.setAttribute('flood-opacity', '0')
        clear.setAttribute('result', 'clear')
        flood.setAttribute('result', 'mark')
        const merge = document.createElementNS(svg, 'feMerge')
        for (const name of ['clear', 'mark']) {
          const node = document.createElementNS(svg, 'feMergeNode')
          node.setAttribute('in', name)
          merge.append(node)
        }
        filter.replaceChildren(clear, flood, merge)
        const rect = probe.getBoundingClientRect()
        return { x: rect.x, y: rect.y }
      })
      const red = await findRed(page, { ...box, width: 160, height: 90 })
      assert.ok(red, 'the production filter rendered')
      assert.ok(Math.abs(red.x - 20) <= 1 && Math.abs(red.y - 10) <= 1, `marker at ${red.x},${red.y}, expected 20,10`)
    } finally {
      await close()
    }
  })

  for (const { name, property, value } of [
    { name: 'a spread shadow', property: 'box-shadow', value: '0 0 0 12px rgb(0 0 0 / 0.2)' },
    { name: 'a blurred shadow', property: 'box-shadow', value: '0 6px 16px -4px rgb(0 0 0 / 0.3)' },
    { name: 'an outer focus ring', property: 'outline', value: '4px solid blue' },
  ]) {
    it(`uses plain blur with ${name} and resumes after it is removed`, async () => {
      const { page, close } = await openFixture()
      try {
        const composer = page.locator('#composer')
        await page.waitForFunction(() =>
          getComputedStyle(document.getElementById('composer')).backdropFilter.startsWith('url('),
        )
        await composer.evaluate((element, { property, value }) => element.style.setProperty(property, value), {
          property,
          value,
        })
        await settle(page, 10)
        await page.waitForFunction(() =>
          getComputedStyle(document.getElementById('composer')).backdropFilter.startsWith('blur('),
        )
        await composer.evaluate((element, property) => element.style.removeProperty(property), property)
        await page.waitForFunction(() =>
          getComputedStyle(document.getElementById('composer')).backdropFilter.startsWith('url('),
        )
      } finally {
        await close()
      }
    })
  }
})
