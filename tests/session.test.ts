import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startSession, nextTodo, type Session } from '../src/session'
import { TEMPLATES } from '../shared/templates'
import { EXERCISES } from '../shared/exercises'
import type { Workout } from '../shared/types'

const core = TEMPLATES[0] // dead_bug, bird_dog, side_plank, cable_wood_chop, pallof_press, farmer_carry

const wk = (id: string, sets: Workout['sets']): Workout => ({
  id, template_key: 'core', started_at: '2026-07-01T10:00:00Z', finished_at: '2026-07-01T10:35:00Z',
  feel_rating: null, note: null, sets,
})

test('startSession with empty history uses library defaults', () => {
  const s = startSession(core, [])
  assert.equal(s.template.key, 'core')
  assert.equal(s.entries.length, core.exercise_keys.length)
  for (const e of s.entries) {
    const d = EXERCISES[e.exercise_key].defaults
    assert.equal(e.sets, d.sets)
    assert.equal(e.reps, d.reps)
    assert.equal(e.weight, d.weight)
    assert.equal(e.status, 'todo')
  }
})

test('startSession prefers most recent history values', () => {
  const history = [
    wk('new', [{ id: 'a', exercise_key: 'cable_wood_chop', sets: 4, reps: 12, weight: 40 }]), // newest first
    wk('old', [{ id: 'b', exercise_key: 'cable_wood_chop', sets: 3, reps: 10, weight: 25 }]),
  ]
  const s = startSession(core, history)
  const chop = s.entries.find((e) => e.exercise_key === 'cable_wood_chop')!
  assert.equal(chop.weight, 40) // newest wins, not 25
  assert.equal(chop.sets, 4)
  assert.equal(chop.reps, 12)
  // exercise absent from history still gets defaults
  const bug = s.entries.find((e) => e.exercise_key === 'dead_bug')!
  assert.equal(bug.reps, EXERCISES.dead_bug.defaults.reps)
})

test('nextTodo advances, wraps, and returns -1 when nothing left', () => {
  const s: Session = startSession(core, [])
  assert.equal(nextTodo(s, 0), 1) // simple advance
  s.entries[1].status = 'done'
  assert.equal(nextTodo(s, 0), 2) // skips done
  // mark all but index 0 finished — wrap around from the end
  for (let i = 1; i < s.entries.length; i++) s.entries[i].status = i % 2 ? 'done' : 'skipped'
  assert.equal(nextTodo(s, 4), 0)
  s.entries[0].status = 'done'
  assert.equal(nextTodo(s, 0), -1) // all done/skipped
})
