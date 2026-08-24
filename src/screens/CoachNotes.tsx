import { useEffect, useState } from 'react'
import * as api from '../api'
import type { Message, Workout } from '../api'
import { TEMPLATES } from '../../shared/templates'

export default function CoachNotes({ messages, workouts, onHome }: {
  messages: Message[]
  workouts: Workout[]
  onHome: () => void
}) {
  // snapshot of unread ids at mount so NEW chips survive the markRead refresh
  const [unseen] = useState(() => new Set(messages.filter((m) => !m.read_at).map((m) => m.id)))
  // App reloads messages whenever the user lands back on Home, which clears the badge
  useEffect(() => { api.markRead().catch(() => {}) }, [])

  const chrome = (m: Message) => {
    const w = workouts.find((w) => w.id === m.workout_id)
    if (!w) return 'A while back'
    const name = TEMPLATES.find((t) => t.key === w.template_key)?.name ?? 'Workout'
    return `${name} · ${new Date(w.finished_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button onClick={onHome} className="min-h-14 font-extrabold text-navy">&larr; Home</button>
      <h1 className="mt-1 text-3xl font-extrabold text-navy">Notes from Chris</h1>

      {messages.length === 0 ? (
        <p className="mt-6 text-xl leading-relaxed text-muted">No notes yet. Chris is speechless, presumably with awe.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {messages.map((m) => {
            const isNew = unseen.has(m.id)
            return (
              <div key={m.id}
                className={`rounded-2xl bg-white p-5 shadow-lg shadow-navy/5 ${isNew ? 'border-l-4 border-teal' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold uppercase tracking-widest text-muted">{chrome(m)}</p>
                  {isNew && <span className="rounded-full bg-navy px-3 py-0.5 text-sm font-bold text-white">NEW</span>}
                </div>
                <p className="mt-2 break-words text-xl leading-relaxed text-navy">{m.body}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
