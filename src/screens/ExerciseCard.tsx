import { useState } from 'react'
import type { Session } from '../session'
import { EXERCISES } from '../../shared/exercises'
import BigButton from '../components/BigButton'
import Help from './Help'
import { illustrationFor } from '../illustrations'

function Stepper({ label, value, step, min, onChange, suffix }: {
  label: string; value: number; step: number; min: number; suffix?: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button aria-label={`decrease ${label}`} onClick={() => onChange(Math.max(min, value - step))}
          className="h-14 w-14 rounded-xl border-2 border-sand bg-white text-2xl font-black text-navy active:bg-sky">&minus;</button>
        <span className="min-w-16 text-center text-2xl font-extrabold text-navy">{value}{suffix ? ` ${suffix}` : ''}</span>
        <button aria-label={`increase ${label}`} onClick={() => onChange(value + step)}
          className="h-14 w-14 rounded-xl border-2 border-sand bg-white text-2xl font-black text-navy active:bg-sky">+</button>
      </div>
    </div>
  )
}

export default function ExerciseCard({ session, index, onDone, onSkip, onList }: {
  session: Session
  index: number
  onDone: (index: number, v: { sets: number; reps: number; weight: number | null }) => void
  onSkip: (index: number) => void
  onList: () => void
}) {
  const entry = session.entries[index]
  const ex = EXERCISES[entry.exercise_key]
  const Art = illustrationFor(entry.exercise_key)
  const [sets, setSets] = useState(entry.sets)
  const [reps, setReps] = useState(entry.reps)
  const [weight, setWeight] = useState(entry.weight)
  const [help, setHelp] = useState(false)

  const finished = session.entries.filter((e) => e.status !== 'todo').length
  const repsLabel = ex.unit === 'seconds' ? 'SECONDS' : ex.unit === 'steps' ? 'STEPS' : 'REPS'
  const repsStep = ex.unit === 'seconds' || ex.unit === 'steps' ? 5 : 1
  const repsMin = ex.unit === 'seconds' || ex.unit === 'steps' ? 5 : 1

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <button onClick={onList} className="min-h-14 font-extrabold text-navy">&lsaquo; List</button>
        <span className="text-sm font-semibold text-muted">{session.template.name}</span>
        <span className="font-bold text-navy">{index + 1} of {session.entries.length}</span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand/40">
        <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${(finished / session.entries.length) * 100}%` }} />
      </div>

      <div className="mt-4 rounded-2xl bg-white p-6 shadow-lg shadow-navy/5">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky">
          <Art size={60} />
        </div>
        <h1 className="mt-3 text-center text-2xl font-extrabold text-navy">{ex.name}</h1>
        <p className="mt-1 text-center text-muted">{ex.quip}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-4">
          <Stepper label="SETS" value={sets} step={1} min={1} onChange={setSets} />
          <Stepper label={repsLabel} value={reps} step={repsStep} min={repsMin} onChange={setReps} />
          {weight !== null && (
            <Stepper label="WEIGHT (LB)" value={weight} step={5} min={0} onChange={setWeight} />
          )}
        </div>

        <div className="mt-6">
          <BigButton onClick={() => onDone(index, { sets, reps, weight })}>DONE &mdash; NEXT</BigButton>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => setHelp(true)} className="min-h-14 flex-1 whitespace-nowrap rounded-xl font-bold text-teal-deep">How do I do this?</button>
          <button onClick={() => onSkip(index)} className="min-h-14 flex-1 whitespace-nowrap rounded-xl font-bold text-muted">Skip this one</button>
        </div>
      </div>

      {help && <Help exercise={ex} onClose={() => setHelp(false)} />}
    </div>
  )
}
