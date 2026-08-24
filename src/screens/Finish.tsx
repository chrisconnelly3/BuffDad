import { useRef, useState } from 'react'
import type { Session } from '../session'
import type { Workout } from '../../shared/types'
import { EXERCISES } from '../../shared/exercises'
import { submitWorkout } from '../api'
import BigButton from '../components/BigButton'
import { subLabel } from './Workout'

// Deterministic headline pick — same session, same headline. No Math.random.
const ALL_DONE = ['Flawless. The photo is getting closer.', 'Every box ticked. Somewhere, Arnold nods.']
const PARTIAL = ['Done is done. The couch is earned.', 'Most of it done. That still counts.']
const NONE_DONE = 'A scouting mission. Respect.'

// left %, px size, color, duration, delay — sky is too close to the page gradient, so teal/sand carry it
const BUBBLES = [
  { left: '8%', size: 14, cls: 'bg-teal/25', dur: '7s', delay: '0s' },
  { left: '22%', size: 22, cls: 'bg-sand/80', dur: '9s', delay: '1.5s' },
  { left: '38%', size: 10, cls: 'bg-teal/15', dur: '6s', delay: '3s' },
  { left: '56%', size: 18, cls: 'bg-sand/60', dur: '8s', delay: '.7s' },
  { left: '73%', size: 12, cls: 'bg-teal/20', dur: '6.5s', delay: '2.2s' },
  { left: '88%', size: 20, cls: 'bg-teal/10', dur: '9.5s', delay: '4s' },
]

const FEELS: { v: NonNullable<Workout['feel_rating']>; label: string }[] = [
  { v: 'easy', label: 'Easy' },
  { v: 'right', label: 'Just right' },
  { v: 'rough', label: 'Rough' },
]

export default function Finish({ session, onSubmitted, onBack }: {
  session: Session
  onSubmitted: (synced: boolean) => void
  onBack: () => void
}) {
  const done = session.entries.filter((e) => e.status === 'done')
  const skipped = session.entries.filter((e) => e.status === 'skipped')
  const todo = session.entries.filter((e) => e.status === 'todo')
  const total = session.entries.length

  const [feel, setFeel] = useState<Workout['feel_rating']>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const workoutRef = useRef<Workout | null>(null) // built once — a retry can never mint a second id
  const [minutes] = useState(() => Math.max(1, Math.round((Date.now() - Date.parse(session.started_at)) / 60000)))

  const headline =
    done.length === 0 ? NONE_DONE
    : done.length === total ? ALL_DONE[done.length % ALL_DONE.length]
    : PARTIAL[done.length / total > 0.5 ? 1 : 0] // "Most of it done" only when it's actually more than half

  const send = async () => {
    if (submitting) return
    setSubmitting(true)
    workoutRef.current ??= {
      id: crypto.randomUUID(),
      template_key: session.template.key,
      started_at: session.started_at,
      finished_at: new Date().toISOString(),
      feel_rating: feel,
      note: note.trim() || null,
      sets: done.map((e) => ({ id: crypto.randomUUID(), exercise_key: e.exercise_key, sets: e.sets, reps: e.reps, weight: e.weight })),
    }
    try {
      onSubmitted(await submitWorkout(workoutRef.current))
    } finally {
      setSubmitting(false) // never leave the button wedged
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="relative overflow-hidden py-10 text-center">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {BUBBLES.map((b, i) => (
            <span key={i} className={`bubble absolute -bottom-6 block rounded-full opacity-0 ${b.cls}`}
              style={{ left: b.left, width: b.size, height: b.size, '--dur': b.dur, '--delay': b.delay } as React.CSSProperties} />
          ))}
        </div>
        <h1 className="relative text-4xl font-extrabold leading-tight text-navy">{headline}</h1>
        <p className="relative mt-3 text-lg font-bold text-teal-deep">
          {done.length} of {total} exercises &middot; {minutes} min
        </p>
      </div>

      <div className="divide-y divide-sky rounded-2xl bg-white px-4 py-1 shadow-lg shadow-navy/5">
        {done.map((e) => (
          <div key={e.exercise_key} className="flex items-baseline justify-between gap-3 py-3">
            <p className="text-lg font-extrabold text-navy">{EXERCISES[e.exercise_key].name}</p>
            <p className="shrink-0 text-muted">{subLabel(e)}</p>
          </div>
        ))}
        {skipped.map((e) => (
          <div key={e.exercise_key} className="flex items-baseline justify-between gap-3 py-3">
            <p className="text-lg font-bold text-muted line-through">{EXERCISES[e.exercise_key].name}</p>
            <p className="shrink-0 text-muted">Skipped</p>
          </div>
        ))}
        {todo.length > 0 && (
          <>
            <p className="py-3 text-sm font-bold uppercase tracking-wide text-muted">Saved for next time</p>
            {todo.map((e) => (
              <div key={e.exercise_key} className="flex items-baseline justify-between gap-3 py-3">
                <p className="text-lg font-bold text-muted">{EXERCISES[e.exercise_key].name}</p>
                <p className="shrink-0 text-muted">{subLabel(e)}</p>
              </div>
            ))}
          </>
        )}
      </div>

      <p className="mt-7 text-center text-xl font-extrabold text-navy">How did that feel?</p>
      <div className="mt-3 flex gap-2">
        {FEELS.map((f) => (
          <button key={f.v} disabled={submitting} onClick={() => setFeel(feel === f.v ? null : f.v)}
            className={`min-h-14 flex-1 rounded-xl border-2 px-1 font-extrabold transition active:scale-[.98] ${
              feel === f.v ? 'border-teal bg-teal text-white' : 'border-sand bg-white text-navy'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <label className="mt-7 block text-xl font-extrabold text-navy" htmlFor="dad-note">
        Anything for Chris? <span className="font-semibold text-muted">(optional)</span>
      </label>
      <textarea id="dad-note" value={note} disabled={submitting} rows={2}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Felt strong today. That last one was a killer&hellip;"
        className="mt-2 w-full rounded-xl border-2 border-sand p-3 text-lg text-navy" />

      <div className="mt-5">
        <BigButton onClick={send} disabled={submitting}>{submitting ? 'SENDING…' : 'SEND TO COACH'}</BigButton>
      </div>
      <button onClick={onBack} disabled={submitting} className="mt-2 min-h-14 w-full text-center font-extrabold text-muted disabled:opacity-40">
        &larr; Back to the workout
      </button>
    </div>
  )
}
