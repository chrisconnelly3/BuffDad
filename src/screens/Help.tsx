import type { Exercise } from '../../shared/exercises'
import BigButton from '../components/BigButton'
import { illustrationFor } from '../illustrations'

export default function Help({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const Art = illustrationFor(exercise.key)
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-gradient-to-b from-sky to-cream">
      <div className="mx-auto max-w-md px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-lg shadow-navy/5">
            <Art size={42} />
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-navy">{exercise.name}</h1>
        </div>

        <ol className="mt-6 space-y-5">
          {exercise.cues.map((cue, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-lg font-extrabold text-white">{i + 1}</span>
              <p className="text-xl leading-relaxed text-navy">{cue}</p>
            </li>
          ))}
        </ol>

        <h2 className="mt-8 text-xl font-extrabold text-navy">Watch out for</h2>
        <ul className="mt-3 space-y-3">
          {exercise.mistakes.map((m, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-navy" aria-hidden="true" />
              <p className="text-xl leading-relaxed text-navy">{m}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-2xl border-2 border-sand bg-white p-5">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-deep">Take it easy</p>
          <p className="mt-2 text-xl leading-relaxed text-navy">{exercise.safety}</p>
        </div>

        {exercise.video && (
          <a href={exercise.video} target="_blank" rel="noopener"
            className="mt-4 block w-full rounded-2xl border-2 border-teal/30 bg-white/70 px-6 py-4 text-center text-xl font-extrabold text-teal-deep">
            Watch a video
          </a>
        )}

        <div className="mt-8">
          <BigButton onClick={onClose}>Got it</BigButton>
        </div>
      </div>
    </div>
  )
}
