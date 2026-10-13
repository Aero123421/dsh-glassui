// Built-in wallpapers, still and animated, on the fixture page.
import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { closeBrowser, openFixture, settle } from './fixture.mjs'

after(closeBrowser)

function live(page) {
  return page.evaluate(() => {
    const layer = document.querySelector('[data-glassui-owned="wallpaper"]')
    return {
      present: layer !== null,
      parent: layer?.parentElement?.tagName,
      before: layer?.nextElementSibling?.tagName,
      zIndex: layer ? getComputedStyle(layer).zIndex : undefined,
      animations: layer
        ? [...layer.querySelectorAll('div')].flatMap(element =>
            element.getAnimations().map(animation => ({
              duration: animation.effect.getTiming().duration,
              easing: animation.effect.getTiming().easing,
              state: animation.playState,
            })),
          )
        : [],
      root: document.documentElement.style.getPropertyValue('--glassui-wallpaper').length,
      name: document.documentElement.getAttribute('data-glassui-wallpaper'),
    }
  })
}

describe('wallpapers', () => {
  it('moves an animated wallpaper behind everything, a dozen steps a second', async () => {
    const { page, errors, close } = await openFixture({ config: { wallpaper: 'aurora' } })
    try {
      const state = await live(page)
      assert.equal(state.present, true)
      assert.equal(state.parent, 'HTML', 'a sibling of <body>, so it paints below the page')
      assert.equal(state.before, 'BODY')
      assert.equal(state.zIndex, '-1')
      assert.equal(state.name, 'aurora')
      assert.ok(state.animations.length >= 2)
      for (const animation of state.animations) {
        assert.equal(animation.state, 'running')
        assert.equal(animation.easing, `steps(${(animation.duration / 1000) * 12})`)
      }
      assert.deepEqual(errors, [])
    } finally {
      await close()
    }
  })

  it('holds still with reduced motion, showing the same first frame', async () => {
    const { page, close } = await openFixture({ config: { wallpaper: 'aurora' }, reducedMotion: true })
    try {
      const state = await live(page)
      assert.equal(state.present, false)
      assert.equal(state.name, 'aurora')
      assert.ok(state.root > 1000, 'the still picture is on <html>')
    } finally {
      await close()
    }
  })

  it('switches between animated and still wallpapers live', async () => {
    const { page, close } = await openFixture()
    try {
      assert.equal((await live(page)).present, false, 'Bay is still')
      await page.evaluate(() => window.__fixture.form.update({ wallpaper: 'tide' }))
      await settle(page)
      assert.equal((await live(page)).present, true)
      await page.evaluate(() => document.body.setAttribute('data-ds-dark-theme', ''))
      await settle(page, 10)
      const dark = await live(page)
      assert.equal(dark.present, true, 'survives a palette switch')
      assert.ok(dark.animations.every(animation => animation.state === 'running'))
      await page.evaluate(() => window.__fixture.form.update({ wallpaper: 'dune' }))
      await settle(page)
      assert.equal((await live(page)).present, false)
      await page.evaluate(() => window.__fixture.form.update({ wallpaper: 'prism' }))
      await settle(page)
      await page.evaluate(() => window.__fixture.dispose())
      await settle(page)
      assert.equal((await live(page)).present, false, 'removed with the plugin')
    } finally {
      await close()
    }
  })

  it('redraws the page about 12 times a second while it moves', async t => {
    const { page, close } = await openFixture({ config: { wallpaper: 'bloom' } })
    try {
      const context = page.context()
      const cdp = await context.newCDPSession(page)
      const events = []
      cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value))
      const done = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve))
      await cdp.send('Tracing.start', {
        categories: 'disabled-by-default-devtools.timeline.frame',
        transferMode: 'ReportEvents',
      })
      await page.waitForTimeout(3000)
      await cdp.send('Tracing.end')
      await done
      const frames = events.filter(event => event.name === 'DrawFrame').length
      if (frames === 0) {
        t.skip('this browser does not report drawn frames')
        return
      }
      // 60 Hz would be ~180; the step clock gives ~36.
      assert.ok(frames <= 60, `${frames} frames drawn in 3 s`)
    } finally {
      await close()
    }
  })
})

describe('cached still wallpaper', () => {
  for (const dark of [false, true])
    for (const refraction of [false, true]) {
      it(`preserves root-background pixels (${dark ? 'dark' : 'light'}, refraction ${refraction})`, async () => {
        const f = await openFixture({ dark, config: { wallpaper: 'bay', refraction } })
        try {
          await settle(f.page, 20)
          await f.page.waitForTimeout(200)
          const after = await f.page.screenshot()
          await f.page.evaluate(() => document.documentElement.removeAttribute('data-glassui-static-wallpaper'))
          const before = await f.page.screenshot()
          assert.deepEqual(after, before, 'same pixels with cached layer and original root SVG')
          assert.deepEqual(f.errors, [])
        } finally {
          await f.close()
        }
      })
    }

  it('retains full cover geometry at DPR2 through rotation, removes the layer on off, and leaves printing clean', async () => {
    const f = await openFixture({
      deviceScaleFactor: 2,
      viewport: { width: 820, height: 1180 },
      config: { refraction: false },
    })
    try {
      for (const viewport of [
        { width: 820, height: 1180 },
        { width: 1180, height: 820 },
      ]) {
        await f.page.setViewportSize(viewport)
        await settle(f.page, 12)
        const cached = await f.page.screenshot()
        await f.page.evaluate(() => document.documentElement.removeAttribute('data-glassui-static-wallpaper'))
        assert.deepEqual(await f.page.screenshot(), cached)
        await f.page.evaluate(() => document.documentElement.setAttribute('data-glassui-static-wallpaper', ''))
      }
      await f.page.emulateMedia({ media: 'print' })
      assert.equal(
        await f.page
          .locator('[data-glassui-owned="static-wallpaper"]')
          .evaluate(el => el.getBoundingClientRect().height),
        0,
      )
      await f.page.emulateMedia({ media: 'screen' })
      await f.page.evaluate(() => window.__fixture.form.update({ enabled: false }))
      assert.equal(await f.page.locator('[data-glassui-owned="static-wallpaper"]').count(), 0)
      assert.equal(await f.page.getAttribute('html', 'data-glassui-static-wallpaper'), null)
      assert.deepEqual(f.errors, [])
    } finally {
      await f.close()
    }
  })
})

it('lets inline root background customizations win and resumes caching when they are removed', async () => {
  const f = await openFixture()
  try {
    await f.page.evaluate(() => (document.documentElement.style.background = 'rgb(12 34 56)'))
    await settle(f.page, 6)
    assert.equal(await f.page.locator('[data-glassui-owned="static-wallpaper"]').count(), 0)
    assert.equal(await f.page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(12, 34, 56)')
    await f.page.evaluate(() => document.documentElement.style.removeProperty('background'))
    await settle(f.page, 6)
    assert.equal(await f.page.locator('[data-glassui-owned="static-wallpaper"]').count(), 1)
    assert.deepEqual(f.errors, [])
  } finally {
    await f.close()
  }
})

it('keeps custom images in the original renderer so animated image timelines are not replaced', async () => {
  const f = await openFixture({
    config: {
      wallpaper: 'custom',
      wallpaperUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    },
  })
  try {
    assert.equal(await f.page.locator('[data-glassui-owned="static-wallpaper"]').count(), 0)
    assert.equal(await f.page.getAttribute('html', 'data-glassui-static-wallpaper'), null)
    assert.ok(
      (await f.page.locator('html').evaluate(el => getComputedStyle(el).backgroundImage)).includes('data:image/gif;'),
    )
    await f.page.evaluate(() => window.__fixture.form.update({ tint: 93 }))
    assert.equal(await f.page.locator('[data-glassui-owned="static-wallpaper"]').count(), 0)
    assert.deepEqual(f.errors, [])
  } finally {
    await f.close()
  }
})
