import { useState } from 'react'
import type { Workout, Message } from '../api'
import type { WorkoutSet } from '../../shared/types'
import { TEMPLATES } from '../../shared/templates'
import { EXERCISES } from '../../shared/exercises'
import BigButton from '../components/BigButton'
import PushCard from '../components/PushCard'

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

// weight column: "25 lb" | "30 sec" | "40 steps" | "—"
const amount = (s: WorkoutSet) => {
  const unit = EXERCISES[s.exercise_key]?.unit
  if (unit === 'lb') return s.weight != null ? `${s.weight} lb` : '—'
  if (unit === 'seconds') return `${s.reps} sec`
  if (unit === 'steps') return `${s.reps} steps`
  return '—'
}

// delta vs the most recent older workout containing the same exercise
// lb compares weight; seconds/steps (and bodyweight) compare reps
const delta = (s: WorkoutSet, older: Workout[]): { label: string; cls: string } => {
  const prev = older.flatMap((w) => w.sets).find((x) => x.exercise_key === s.exercise_key)
  if (!prev) return { label: 'new', cls: 'text-muted' }
  const unit = EXERCISES[s.exercise_key]?.unit
  const [cur, was, suffix] = unit === 'lb'
    ? [s.weight, prev.weight, ' lb']
    : [s.reps, prev.reps, unit === 'seconds' ? ' sec' : unit === 'steps' ? ' steps' : '']
  if (cur == null || was == null || cur === was) return { label: '→', cls: 'text-muted' }
  return cur > was
    ? { label: `+${cur - was}${suffix}`, cls: 'font-bold text-teal-deep' }
    : { label: `−${was - cur}${suffix}`, cls: 'text-muted' }
}

const FEEL: Record<string, { label: string; cls: string }> = {
  easy: { label: 'Felt: Easy', cls: 'bg-sky text-navy' },
  right: { label: 'Felt: Just right', cls: 'bg-teal text-white' },
  rough: { label: 'Felt: Rough', cls: 'bg-sand text-navy' },
}

function WorkoutCard({ workout, older, replies, onSend }: {
  workout: Workout
  older: Workout[]
  replies: Message[]
  onSend: (workout_id: string, body: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const name = TEMPLATES.find((t) => t.key === workout.template_key)?.name ?? workout.template_key
  const mins = Math.max(0, Math.round((Date.parse(workout.finished_at) - Date.parse(workout.started_at)) / 60000))
  const feel = workout.feel_rating ? FEEL[workout.feel_rating] : null

  const send = async () => {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setSendError(false)
    try {
      await onSend(workout.id, body)
      setDraft('')
    } catch {
      setSendError(true) // draft kept — sendMessage throws on non-ok
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-lg shadow-navy/5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-xl font-extrabold text-navy">{name}</h2>
        <p className="text-sm text-muted">{shortDate(workout.finished_at)} &middot; {mins} min</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {feel && <span className={`rounded-full px-2 py-0.5 text-sm font-bold ${feel.cls}`}>{feel.label}</span>}
        {replies.length === 0 && (
          <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-900">
            Needs feedback
          </span>
        )}
      </div>

      {workout.sets.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Showed up, logged nothing. Still counts.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <tbody>
            {workout.sets.map((s) => {
              const d = delta(s, older)
              return (
                <tr key={s.id} className="border-t border-sky first:border-t-0">
                  <td className="py-1.5 pr-2 font-semibold text-navy">{EXERCISES[s.exercise_key]?.name ?? s.exercise_key}</td>
                  <td className="whitespace-nowrap py-1.5 pr-2 text-muted">{s.sets}&times;{s.reps}</td>
                  <td className="whitespace-nowrap py-1.5 pr-2 text-muted">{amount(s)}</td>
                  <td className={`whitespace-nowrap py-1.5 text-right ${d.cls}`}>{d.label}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {workout.note && <p className="mt-3 break-words text-sm italic text-muted">Dad says: &ldquo;{workout.note}&rdquo;</p>}

      {replies.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-sand pt-3">
          {replies.map((m) => (
            <p key={m.id} className="break-words text-sm text-muted">
              You: {m.body} <span className="whitespace-nowrap">&middot; {shortDate(m.created_at)}</span>
            </p>
          ))}
        </div>
      )}

      <div className="mt-4">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
          placeholder="Tell him what you saw&hellip;" aria-label={`Reply about ${name}`}
          className="w-full rounded-xl border-2 border-sand p-3 text-navy" />
        {sendError && <p className="mt-1 text-sm font-bold text-amber-900">Didn’t send. Try again.</p>}
        <div className="mt-2">
          <BigButton onClick={send} disabled={!draft.trim() || sending}>
            {sending ? 'Sending…' : 'Send note'}
          </BigButton>
        </div>
      </div>
    </div>
  )
}

export default function Coach({ workouts, messages, onSend }: {
  workouts: Workout[]
  messages: Message[]
  onSend: (workout_id: string, body: string) => Promise<void>
}) {
  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="text-3xl font-extrabold text-navy">BuffDad Coach Console</h1>
      <p className="mt-1 font-semibold text-muted">
        {workouts.length} report{workouts.length === 1 ? '' : 's'} filed.
      </p>

      <PushCard prompt="Get pinged when a report lands." />

      {workouts.length === 0 ? (
        <p className="mt-6 text-xl leading-relaxed text-muted">No workouts yet. The machine sleeps.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {workouts.map((w, i) => (
            <WorkoutCard key={w.id} workout={w} older={workouts.slice(i + 1)}
              replies={messages.filter((m) => m.workout_id === w.id).reverse()}
              onSend={onSend} />
          ))}
        </div>
      )}
    </div>
  )
}
