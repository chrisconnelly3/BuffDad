import type { Session, Entry } from '../session'
import { EXERCISES } from '../../shared/exercises'
import BigButton from '../components/BigButton'

// "3 × 10 · 25 lb" | "3 × 30 sec" | "3 × 40 steps" | "3 × 10"
export function subLabel(e: Entry): string {
  const unit = EXERCISES[e.exercise_key].unit
  if (unit === 'seconds') return `${e.sets} × ${e.reps} sec`
  if (unit === 'steps') return `${e.sets} × ${e.reps} steps`
  if (unit === 'lb') return `${e.sets} × ${e.reps} · ${e.weight} lb`
  return `${e.sets} × ${e.reps}`
}

const Chevron = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-teal">
    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function StatusCircle({ status }: { status: Entry['status'] }) {
  if (status === 'done')
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 13l5 5L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  if (status === 'skipped') return <span className="h-8 w-8 shrink-0 rounded-full border-2 border-dashed border-muted/60" />
  return <span className="h-8 w-8 shrink-0 rounded-full border-2 border-sand" />
}

export default function Workout({ session, onOpen, onHome, onFinished }: {
  session: Session
  onOpen: (index: number) => void
  onHome: () => void
  onFinished: () => void
}) {
  const doneCount = session.entries.filter((e) => e.status === 'done').length
  const touched = session.entries.some((e) => e.status !== 'todo')
  const leave = () => {
    if (!touched || window.confirm('Leave this workout? Nothing will be saved.')) onHome()
  }
  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button onClick={leave} className="min-h-14 font-extrabold text-navy">&larr; Home</button>
      <h1 className="mt-1 text-3xl font-extrabold text-navy">{session.template.name}</h1>
      <p className="mt-1 text-muted">Tap an exercise to get after it.</p>

      <div className="mt-5 space-y-3">
        {session.entries.map((e, i) => {
          const done = e.status === 'done'
          return (
            <button key={e.exercise_key} onClick={() => onOpen(i)}
              className="flex min-h-14 w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-lg shadow-navy/5 transition active:scale-[.98]">
              <StatusCircle status={e.status} />
              <div className={`flex-1 ${e.status !== 'todo' ? 'opacity-60' : ''}`}>
                <p className={`text-xl font-extrabold text-navy ${done ? 'line-through' : ''}`}>{EXERCISES[e.exercise_key].name}</p>
                <p className="text-muted">{e.status === 'skipped' ? 'Skipped' : subLabel(e)}</p>
              </div>
              <Chevron />
            </button>
          )
        })}
      </div>

      <p className="mt-6 text-center font-semibold text-muted">{doneCount} of {session.entries.length} conquered</p>
      {doneCount > 0 && (
        <div className="mt-3">
          <BigButton variant="ghost"
            onClick={() => { if (window.confirm('Wrap it up here? The rest can wait for next time.')) onFinished() }}>
            Finish early
          </BigButton>
        </div>
      )}
    </div>
  )
}
