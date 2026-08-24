import type { Workout } from '../api'
import { nextTemplate } from '../../shared/templates'
import BigButton from '../components/BigButton'
import PushCard from '../components/PushCard'

const GREETINGS = [
  'Hello, legend.',
  'Back at it.',
  'Looking strong.',
  'Time to lift.',
  'Morning, champ.',
  'Still buff.',
  'Let’s move.',
  'The iron waits.',
  'Ready to roll.',
  'Let’s get after it.',
]

const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-teal">
    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function Home({ workouts, unread, go }: {
  workouts: Workout[]
  unread: number
  go: (v: 'workout' | 'progress' | 'notes') => void
}) {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 864e5)
  const greeting = GREETINGS[dayOfYear % GREETINGS.length]
  const tpl = nextTemplate(workouts[0]?.template_key ?? null)
  const total = workouts.length
  const recent = workouts.filter((w) => now.getTime() - Date.parse(w.finished_at) < 14 * 864e5).length

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <p className="text-sm font-semibold text-muted">{now.toLocaleDateString('en-US', { weekday: 'long' })}</p>
      <h1 className="text-[1.75rem] font-extrabold leading-tight text-navy">{greeting}</h1>

      <div className="mt-3 rounded-2xl bg-white p-4 shadow-lg shadow-navy/5">
        <p className="text-sm font-bold uppercase tracking-widest text-teal-deep">Up next</p>
        <h2 className="mt-0.5 text-2xl font-extrabold text-navy">{tpl.name}</h2>
        <p className="mt-0.5 text-muted">{tpl.tagline}</p>
        <p className="mt-2 font-semibold text-muted">{tpl.exercise_keys.length} exercises &middot; about 35 min</p>
      </div>

      <div className="mt-3">
        <BigButton onClick={() => go('workout')}>START WORKOUT</BigButton>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-lg shadow-navy/5">
          <p className="text-3xl font-extrabold text-navy">{total}</p>
          <p className="mt-0.5 text-sm leading-snug text-muted">{total === 1 ? 'workout logged' : 'workouts logged'}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-lg shadow-navy/5">
          <p className="text-3xl font-extrabold text-navy">{recent}</p>
          <p className="mt-0.5 text-sm leading-snug text-muted">in the last 14 days</p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <button onClick={() => go('notes')}
          className="flex min-h-14 items-center justify-between gap-1 rounded-2xl bg-white p-4 text-left shadow-lg shadow-navy/5 transition active:scale-[.98]">
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-tight text-navy">Notes from Chris</p>
            {unread > 0
              ? <span className="mt-1 inline-block rounded-full bg-navy px-2 py-0.5 text-xs font-bold text-white">{unread} new</span>
              : <p className="mt-0.5 text-sm text-muted">All read</p>}
          </div>
          <Chevron />
        </button>
        <button onClick={() => go('progress')}
          className="flex min-h-14 items-center justify-between gap-1 rounded-2xl bg-white p-4 text-left shadow-lg shadow-navy/5 transition active:scale-[.98]">
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-tight text-navy">Progress</p>
            <p className="mt-0.5 text-sm text-muted">The Gains Report</p>
          </div>
          <Chevron />
        </button>
      </div>

      <PushCard prompt="Turn on reminders?" />
    </div>
  )
}
