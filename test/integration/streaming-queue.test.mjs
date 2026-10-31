import assert from 'node:assert/strict'
import { after, it } from 'node:test'
import { closeBrowser, openFixture, settle } from './fixture.mjs'

after(closeBrowser)

it('discovers streamed siblings without comparing every pair of their subtrees', async t => {
  const { page, errors, close } = await openFixture({ config: { refraction: false } })
  try {
    await page.evaluate(() => {
      const rows = new WeakSet()
      const contains = Node.prototype.contains
      let comparisons = 0
      Node.prototype.contains = function (other) {
        if (rows.has(this) && rows.has(other)) comparisons++
        return contains.call(this, other)
      }
      window.__streamingQueue = {
        count: () => comparisons,
        restore: () => {
          Node.prototype.contains = contains
        },
      }
      const fragment = document.createDocumentFragment()
      for (let index = 0; index < 200; index++) {
        const row = document.createElement('div')
        rows.add(row)
        if (index % 64 === 0) {
          row.id = `stream-panel-${index}`
          row.style.cssText =
            'width:120px;height:40px;background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-panel)'
        }
        fragment.append(row)
      }
      document.getElementById('chat').append(fragment)
    })
    await settle(page, 30)
    const comparisons = await page.evaluate(() => window.__streamingQueue.count())
    t.diagnostic(`${comparisons} native ancestry comparisons for 200 siblings`)
    assert.ok(comparisons <= 200 * 4, `${comparisons} ancestry comparisons for 200 siblings`)
    for (const index of [0, 64, 128, 192]) {
      assert.equal(await page.locator(`#stream-panel-${index}`).getAttribute('data-glassui-surface'), 'panel')
    }
    // An added descendant can precede its added ancestor in the mutation queue;
    // both that subtree and a moved, already tagged panel must still be scanned.
    await page.evaluate(() => {
      const chat = document.getElementById('chat')
      const wrapper = document.createElement('div')
      const parent = document.createElement('div')
      const child = document.createElement('div')
      chat.append(wrapper, parent, child)
      child.id = 'nested-stream-panel'
      child.style.cssText =
        'width:120px;height:40px;background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-panel)'
      parent.append(child)
      wrapper.append(parent)
      wrapper.append(document.getElementById('stream-panel-64'))
    })
    await settle(page, 30)
    assert.equal(await page.locator('#nested-stream-panel').getAttribute('data-glassui-surface'), 'panel')
    assert.equal(await page.locator('#stream-panel-64').getAttribute('data-glassui-surface'), 'panel')
    assert.deepEqual(errors, [])
  } finally {
    await page.evaluate(() => window.__streamingQueue?.restore())
    await close()
  }
})
