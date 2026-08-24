import type { Workout } from '../api'
import { EXERCISES } from '../../shared/exercises'

// largest item ≤ total wins
const LADDER: [number, string][] = [
  [25000, 'a humpback whale'],
  [12000, 'a school bus'],
  [6000, 'an elephant'],
  [3000, 'a small car'],
  [1500, 'a walrus'],
  [500, 'a grand piano'],
]

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Progress({ workouts, onHome }: { workouts: Workout[]; onHome: () => void }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Monday of the week 7 weeks before this one → 8 rows ending on the current week
  const start = new Date(today)
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 49)
  const workedDays = new Set(workouts.map((w) => new Date(w.finished_at).toDateString()))
  const cells = Array.from({ length: 56 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  // strength trends: per lb exercise, one point per workout, oldest → newest
  const byExercise = new Map<string, { weight: number; sets: number; reps: number }[]>()
  for (const w of [...workouts].reverse()) {
    const seen = new Set<string>()
    for (const s of w.sets) {
      if (EXERCISES[s.exercise_key]?.unit !== 'lb' || s.weight == null || seen.has(s.exercise_key)) continue
      seen.add(s.exercise_key)
      if (!byExercise.has(s.exercise_key)) byExercise.set(s.exercise_key, [])
      byExercise.get(s.exercise_key)!.push({ weight: s.weight, sets: s.sets, reps: s.reps })
    }
  }
  const trendRows = [...byExercise]
    .filter(([, pts]) => pts.length >= 2)
    .sort(([a], [b]) => EXERCISES[a].name.localeCompare(EXERCISES[b].name))

  // fun total: sets × reps × weight over this calendar month, lb exercises only
  const monthTotal = workouts.reduce((sum, w) => {
    const d = new Date(w.finished_at)
    if (d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear()) return sum
    return sum + w.sets.reduce((s, x) =>
      EXERCISES[x.exercise_key]?.unit === 'lb' && x.weight != null ? s + x.sets * x.reps * x.weight : s, 0)
  }, 0)
  const ladderItem = LADDER.find(([t]) => monthTotal >= t)?.[1]

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button onClick={onHome} className="min-h-14 font-extrabold text-navy">&larr; Home</button>
      <h1 className="mt-1 text-3xl font-extrabold text-navy">The Gains Report</h1>

      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-muted">Last 8 weeks</p>
      <div className="mt-2 rounded-2xl bg-white p-5 shadow-lg shadow-navy/5">
        <p className="sr-only">{`Worked out ${cells.filter((d) => workedDays.has(d.toDateString())).length} of the last 56 days.`}</p>
        <div className="grid grid-cols-7 gap-y-2" aria-hidden="true">
          {DAY_LETTERS.map((l, i) => (
            <p key={i} className="text-center text-xs font-bold text-muted">{l}</p>
          ))}
          {cells.map((d) => {
            const worked = workedDays.has(d.toDateString())
            const isToday = d.toDateString() === today.toDateString()
            return (
              <span key={d.toDateString()}
                className={`mx-auto h-3.5 w-3.5 rounded-full ${worked ? 'bg-teal' : 'border border-sand bg-sand/20'} ${isToday ? 'ring-2 ring-navy' : ''}`} />
            )
          })}
        </div>
      </div>

      {workouts.length === 0 ? (
        <p className="mt-6 text-xl leading-relaxed text-muted">Your first workout unlocks this page. No pressure. Some pressure.</p>
      ) : (
        <>
          <p className="mt-8 text-sm font-bold uppercase tracking-widest text-muted">Strength trends</p>
          {trendRows.length === 0 ? (
            <p className="mt-2 text-xl leading-relaxed text-muted">Do an exercise twice and the trend lines start here.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {trendRows.map(([key, pts]) => {
                const first = pts[0].weight
                const last = pts[pts.length - 1].weight
                const weights = pts.map((p) => p.weight)
                const min = Math.min(...weights)
                const max = Math.max(...weights)
                const line = weights
                  .map((w, i) => {
                    const x = 6 + (i * 108) / (weights.length - 1)
                    const y = max === min ? 16 : 26 - ((w - min) / (max - min)) * 20
                    return `${x},${y}`
                  })
                  .join(' ')
                const latest = pts[pts.length - 1]
                return (
                  <div key={key} className="rounded-2xl bg-white p-5 shadow-lg shadow-navy/5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-extrabold text-navy">{EXERCISES[key].name}</p>
                      <p className={last > first ? 'font-bold text-teal-deep' : 'font-bold text-muted'}>
                        {first} &rarr; {last} lb
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <svg viewBox="0 0 120 32" className="h-8 w-[120px] shrink-0" aria-hidden="true">
                        <polyline points={line} fill="none" stroke="var(--color-teal)" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm text-muted">{latest.sets} &times; {latest.reps} last time</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {monthTotal > 0 && (
            <div className="mt-8 rounded-2xl bg-navy p-5 text-white shadow-lg shadow-navy/20">
              <p className="text-2xl font-extrabold">You&rsquo;ve lifted {monthTotal.toLocaleString()} lb this month.</p>
              <p className="mt-2 text-white/80">
                {ladderItem ? <>That&rsquo;s roughly {ladderItem}. Give or take.</> : <>Every rep counts. The walrus awaits.</>}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
