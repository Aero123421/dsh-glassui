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
