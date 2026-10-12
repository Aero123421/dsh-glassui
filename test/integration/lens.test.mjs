// Refraction relies on how Chromium places SVG filters used in backdrop-filter.
// These tests pin that behavior, so a browser change shows up in CI before users see it.
import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { inkShift } from '../../src/client/engine/ink.ts'
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
      // The contained elevation keeps the shift to the 1px hairline.
      assert.ok(['0', '-1'].includes(state.filter.x), `filter x ${state.filter.x}`)
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

  // The engine's compensation (src/client/engine/ink.ts) assumes Chromium moves the
  // filter origin right and down by the shadow reach. If this starts failing, Chromium
  // changed that placement and the compensation must follow.
  for (const { name, shadow } of [
    { name: 'no shadow', shadow: 'none' },
    { name: 'a spread shadow', shadow: '0 0 0 12px rgb(0 0 0 / 0.2)' },
    { name: 'a blurred shadow', shadow: '0 6px 16px -4px rgb(0 0 0 / 0.3)' },
  ]) {
    it(`places SVG backdrop filters where the engine expects with ${name}`, async () => {
      const { page, close } = await openFixture({ plugin: false })
      try {
        const style = await page.evaluate(shadow => {
          const probe = document.createElement('div')
          probe.id = 'canary-probe'
          probe.style.cssText = `position:fixed;left:200px;top:200px;width:160px;height:90px;box-shadow:${shadow}`
          document.body.append(probe)
          const { boxShadow, outlineStyle, outlineWidth, outlineOffset } = getComputedStyle(probe)
          return { boxShadow, outlineStyle, outlineWidth, outlineOffset }
        }, shadow)
        // The engine's own arithmetic decides where the marker should land.
        const shift = inkShift(style)
        await page.evaluate(({ x, y }) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          svg.setAttribute('width', '0')
          svg.setAttribute('height', '0')
          svg.style.position = 'absolute'
          // Like the lens filter, the output covers the whole region (Chromium misplaces
          // the output of a filter whose result is smaller than its region).
          svg.innerHTML =
            `<filter id="canary" x="${-x}" y="${-y}" width="160" height="90" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse">` +
            '<feFlood flood-opacity="0" result="clear"/>' +
            `<feFlood flood-color="#ff0000" x="${-x + 20}" y="${-y + 10}" width="8" height="8" result="mark"/>` +
            '<feMerge><feMergeNode in="clear"/><feMergeNode in="mark"/></feMerge></filter>'
          document.body.append(svg)
          document.getElementById('canary-probe').style.backdropFilter = 'url(#canary)'
        }, shift)
        const box = { x: 200, y: 200 }
        await settle(page)
        const red = await findRed(page, { x: box.x - 40, y: box.y - 40, width: 240, height: 170 })
        assert.ok(red, 'the probe filter rendered')
        assert.ok(Math.abs(red.x - 60) <= 1 && Math.abs(red.y - 50) <= 1, `marker at ${red.x},${red.y}, expected 60,50`)
      } finally {
        await close()
      }
    })
  }
})
