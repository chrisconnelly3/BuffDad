import type { Workout } from '../shared/types'
import { EXERCISES } from '../shared/exercises'
import type { Template } from '../shared/templates'

export type Entry = { exercise_key: string; sets: number; reps: number; weight: number | null; status: 'todo' | 'done' | 'skipped' }
export type Session = { template: Template; started_at: string; entries: Entry[] }

// Pre-fill from the most recent completed instance of each exercise, else library defaults.
// history is newest-first (API order).
export function startSession(template: Template, history: Workout[]): Session {
  const entries = template.exercise_keys.map((key) => {
    const last = history.flatMap((w) => w.sets).find((s) => s.exercise_key === key)
    const d = EXERCISES[key].defaults
    return { exercise_key: key, sets: last?.sets ?? d.sets, reps: last?.reps ?? d.reps, weight: last?.weight ?? d.weight, status: 'todo' as const }
  })
  return { template, started_at: new Date().toISOString(), entries }
}

// Next 'todo' after index `after`, wrapping around; -1 if none left.
export function nextTodo(s: Session, after: number): number {
  const n = s.entries.length
  for (let i = 1; i <= n; i++) {
    const idx = (after + i) % n
    if (s.entries[idx].status === 'todo') return idx
  }
  return -1
}
