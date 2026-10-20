import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

describe('release workflow', () => {
  it('creates a draft and does not edit an existing release', () => {
    const yaml = readFileSync(new URL('../../.github/workflows/release.yml', import.meta.url), 'utf8')
    const step = yaml.slice(yaml.indexOf('- name: Publish'))
    assert.ok(step.startsWith('- name: Publish'))
    assert.match(step, /gh release upload /)
    assert.doesNotMatch(step, /gh release edit/)
    const created = step.slice(step.indexOf('gh release create'))
    assert.match(created, /^gh release create[^\n]*--draft/)
    assert.doesNotMatch(created, /--draft=false/)
  })
})
