import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { blurRadiusPx } from '../../src/client/engine/engine.ts'

describe('blurRadiusPx', () => {
  it('removes blur when transparency is reduced, including when contrast is increased', () => {
    assert.equal(blurRadiusPx(0, true, false), 0)
    assert.equal(blurRadiusPx(35, true, false), 0)
    assert.equal(blurRadiusPx(100, true, true), 0)
  })

  it('keeps the tint curve and the increased-contrast floor', () => {
    assert.equal(blurRadiusPx(0, false, false), 6)
    assert.equal(blurRadiusPx(35, false, false), 6 + 0.35 * 22)
    assert.equal(blurRadiusPx(100, false, false), 28)
    assert.equal(blurRadiusPx(0, false, true), 6 + 0.85 * 22)
    assert.equal(blurRadiusPx(100, false, true), 28)
  })
})
