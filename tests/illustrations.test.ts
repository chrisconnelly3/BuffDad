import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EXERCISES } from '../shared/exercises'
import { ILLUSTRATION, illustrationFor } from '../src/illustrations'

test('every exercise has an illustration, and no strays', () => {
  for (const key of Object.keys(EXERCISES)) {
    assert.equal(typeof ILLUSTRATION[key], 'function', `missing illustration for ${key}`)
  }
  for (const key of Object.keys(ILLUSTRATION)) {
    assert.ok(EXERCISES[key], `illustration for unknown exercise ${key}`)
  }
  assert.equal(typeof illustrationFor('not_a_real_exercise'), 'function') // safe fallback
})
