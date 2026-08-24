import { TOKEN } from './session-ctx'
import type { Workout, Message } from '../shared/types'

export type { Workout, Message }

const H = { 'x-buffdad-token': TOKEN, 'content-type': 'application/json' }
const QKEY = 'buffdad-queue'

export const getWorkouts = (): Promise<Workout[]> => fetch('/api/workouts', { headers: H }).then((r) => r.json())
export const getMessages = (): Promise<Message[]> => fetch('/api/messages', { headers: H }).then((r) => r.json())
export const markRead = () =>
  fetch('/api/messages/mark-read', { method: 'POST', headers: H })
    .then((r) => { if (!r.ok) console.error('mark-read failed', r.status) })
export const sendMessage = (workout_id: string, body: string) =>
  fetch('/api/messages', { method: 'POST', headers: H, body: JSON.stringify({ workout_id, body }) })
    .then((r) => { if (!r.ok) throw new Error(`send failed: ${r.status}`) })

// Offline-safe workout submit: queue in localStorage, flush when possible.
// Idempotent server-side (client UUIDs + INSERT OR IGNORE), so double-flush is harmless.
function readQueue(): Workout[] {
  try {
    const q = JSON.parse(localStorage.getItem(QKEY) ?? '[]')
    return Array.isArray(q) ? q : []
  } catch { return [] } // corrupt queue must never block a new workout
}

export async function submitWorkout(w: Workout): Promise<boolean> {
  try {
    const q = readQueue()
    localStorage.setItem(QKEY, JSON.stringify([...q, w]))
  } catch {
    // couldn't persist to the queue (quota/private mode) — try a direct send so the workout isn't lost
    try {
      const r = await fetch('/api/workouts', { method: 'POST', headers: H, body: JSON.stringify(w) })
      return r.ok
    } catch { return false }
  }
  if (await flushQueue()) return true
  return flushQueue() // first call may have joined a flush that snapshotted before our append
}

// Single-flight: load/online/submit can all trigger a flush; racing flushes
// could clobber the queue with a stale snapshot and drop a workout.
let inflight: Promise<boolean> | null = null
export function flushQueue(): Promise<boolean> {
  return (inflight ??= doFlush().finally(() => { inflight = null }))
}

async function doFlush() {
  const q: Workout[] = readQueue()
  const remaining: Workout[] = []
  for (const w of q) {
    try {
      const r = await fetch('/api/workouts', { method: 'POST', headers: H, body: JSON.stringify(w) })
      if (!r.ok) remaining.push(w)
    } catch { remaining.push(w) }
  }
  // merge: keep anything submitWorkout appended while we were flushing
  const now: Workout[] = readQueue()
  const flushedIds = new Set(q.map((w) => w.id))
  const merged = [...remaining, ...now.filter((w) => !flushedIds.has(w.id))]
  localStorage.setItem(QKEY, JSON.stringify(merged))
  return merged.length === 0
}
