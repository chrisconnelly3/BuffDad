import { test } from 'node:test'
import assert from 'node:assert/strict'

// Stub browser globals api.ts needs, before importing it.
const store = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
}

let fetchImpl: (...args: any[]) => Promise<any> = () => { throw new Error('unset') }
;(globalThis as any).fetch = (...args: any[]) => fetchImpl(...args)

const { submitWorkout, flushQueue } = await import('../src/api')

const workout = {
  id: 'w1', template_key: 'core', started_at: '2026-07-19T10:00:00Z', finished_at: '2026-07-19T10:35:00Z',
  feel_rating: 'right' as const, note: null, sets: [],
}

test('queue: offline submit keeps item queued, later flush with ok fetch empties it', async () => {
  fetchImpl = async () => { throw new Error('offline') }
  const ok1 = await submitWorkout(workout)
  assert.equal(ok1, false)
  assert.equal(JSON.parse(store.get('buffdad-queue')!).length, 1)

  fetchImpl = async () => new Response(null, { status: 200 })
  const ok2 = await flushQueue()
  assert.equal(ok2, true)
  assert.equal(JSON.parse(store.get('buffdad-queue')!).length, 0)
})
