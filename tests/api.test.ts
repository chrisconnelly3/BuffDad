import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDb } from '../server/db'
import { createApp } from '../server/app'
import { EXERCISES } from '../shared/exercises'
import { TEMPLATES } from '../shared/templates'

test('openDb creates schema', () => {
  const db = openDb(':memory:')
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r: any) => r.name)
  for (const t of ['workouts', 'workout_sets', 'messages', 'push_subs']) assert.ok(tables.includes(t), t)
})

const H = (t: string) => ({ 'x-buffdad-token': t, 'content-type': 'application/json' })
const workout = {
  id: 'w1', template_key: 'core', started_at: '2026-07-19T10:00:00Z', finished_at: '2026-07-19T10:35:00Z',
  feel_rating: 'right', note: null,
  sets: [{ id: 's1', exercise_key: 'cable_wood_chop', sets: 3, reps: 10, weight: 25 }],
}

test('workouts: reject bad token, accept dad, idempotent, listable by coach', async () => {
  let notified = 0
  const app = createApp(openDb(':memory:'), { onWorkout: () => notified++ })
  assert.equal((await app.request('/api/workouts', { method: 'POST', headers: H('nope'), body: JSON.stringify(workout) })).status, 401)
  assert.equal((await app.request('/api/workouts', { method: 'POST', headers: H('dev-coach'), body: JSON.stringify(workout) })).status, 403)
  assert.equal((await app.request('/api/workouts', { method: 'POST', headers: H('dev-dad'), body: JSON.stringify(workout) })).status, 200)
  assert.equal((await app.request('/api/workouts', { method: 'POST', headers: H('dev-dad'), body: JSON.stringify(workout) })).status, 200) // retry ok
  const res = await app.request('/api/workouts', { headers: H('dev-coach') })
  const list = await res.json()
  assert.equal(list.length, 1)
  assert.equal(list[0].sets[0].weight, 25)
  assert.equal(notified, 1) // retry did not re-notify
})

test('messages: coach posts, dad reads + marks read', async () => {
  const app = createApp(openDb(':memory:'))
  await app.request('/api/workouts', { method: 'POST', headers: H('dev-dad'), body: JSON.stringify(workout) })
  assert.equal((await app.request('/api/messages', { method: 'POST', headers: H('dev-dad'), body: JSON.stringify({ workout_id: 'w1', body: 'hi' }) })).status, 403)
  assert.equal((await app.request('/api/messages', { method: 'POST', headers: H('dev-coach'), body: JSON.stringify({ workout_id: 'w1', body: '   ' }) })).status, 400)
  assert.equal((await app.request('/api/messages', { method: 'POST', headers: H('dev-coach'), body: JSON.stringify({ workout_id: 'nope', body: 'hi' }) })).status, 400)
  const post = await app.request('/api/messages', { method: 'POST', headers: H('dev-coach'), body: JSON.stringify({ workout_id: 'w1', body: 'More weight on chops, Arnold.' }) })
  assert.equal(post.status, 200)
  assert.equal((await app.request('/api/messages/mark-read', { method: 'POST', headers: H('dev-coach') })).status, 403)
  let msgs = await (await app.request('/api/messages', { headers: H('dev-dad') })).json()
  assert.equal(msgs.length, 1)
  assert.equal(msgs[0].read_at, null)
  await app.request('/api/messages/mark-read', { method: 'POST', headers: H('dev-dad') })
  msgs = await (await app.request('/api/messages', { headers: H('dev-dad') })).json()
  assert.notEqual(msgs[0].read_at, null)
})

test('push: subscribe stores sub by role', async () => {
  const db = openDb(':memory:')
  const app = createApp(db)
  const sub = { endpoint: 'https://push.example/x', keys: { p256dh: 'a', auth: 'b' } }
  await app.request('/api/push/subscribe', { method: 'POST', headers: H('dev-dad'), body: JSON.stringify(sub) })
  await app.request('/api/push/subscribe', { method: 'POST', headers: H('dev-dad'), body: JSON.stringify(sub) }) // re-subscribe upserts
  const rows = db.prepare('SELECT role FROM push_subs').all() as any[]
  assert.equal(rows.length, 1)
  assert.equal(rows[0].role, 'dad')
  assert.equal((await app.request('/api/push/subscribe', { method: 'POST', headers: H('dev-dad'), body: JSON.stringify({}) })).status, 400)
})

test('templates reference real exercises', () => {
  for (const t of TEMPLATES) for (const k of t.exercise_keys) assert.ok(EXERCISES[k], `${t.key}: ${k}`)
  for (const [k, e] of Object.entries(EXERCISES)) {
    assert.equal(e.key, k)
    assert.ok(e.quip.trim() && e.safety.trim(), k)
    assert.ok(e.cues.length >= 3 && e.cues.length <= 5, `${k}: cues`)
    assert.ok(e.cues.every((c) => c.trim()) && e.mistakes.length >= 2 && e.mistakes.every((m) => m.trim()), k)
    assert.equal(e.defaults.weight === null, e.unit !== 'lb', `${k}: weight/unit`)
    if (e.video !== null) assert.match(e.video, /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/, `${k}: video url`)
  }
})
