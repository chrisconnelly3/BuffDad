import { useEffect, useState } from 'react'
import { ROLE } from './session-ctx'
import * as api from './api'
import { nextTemplate } from '../shared/templates'
import { startSession, nextTodo, type Session } from './session'
import Splash from './screens/Splash'
import Home from './screens/Home'
import Workout from './screens/Workout'
import ExerciseCard from './screens/ExerciseCard'
import Finish from './screens/Finish'
import Progress from './screens/Progress'
import CoachNotes from './screens/CoachNotes'
import Coach from './screens/Coach'

export default function App() {
  return ROLE === 'coach' ? <CoachApp /> : <DadApp />
}

function CoachApp() {
  const [workouts, setWorkouts] = useState<api.Workout[]>([])
  const [messages, setMessages] = useState<api.Message[]>([])
  const reload = () => {
    api.getWorkouts().then((w) => setWorkouts(Array.isArray(w) ? w : [])).catch(() => {})
    api.getMessages().then((m) => setMessages(Array.isArray(m) ? m : [])).catch(() => {})
  }
  useEffect(() => {
    reload()
    // coach usually arrives from a push notification — refresh when the tab wakes up
    const onVis = () => { if (document.visibilityState === 'visible') reload() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])
  const onSend = async (workout_id: string, body: string) => {
    await api.sendMessage(workout_id, body)
    reload()
  }
  return <Coach workouts={workouts} messages={messages} onSend={onSend} />
}

type View = 'home' | 'workout' | 'finish' | 'progress' | 'notes'

function DadApp() {
  const [view, setView] = useState<View>('home')
  const [splash, setSplash] = useState(true)
  const [workouts, setWorkouts] = useState<api.Workout[]>([])
  const [messages, setMessages] = useState<api.Message[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null) // null = checklist
  const [toast, setToast] = useState<string | null>(null)
  const reload = () => {
    api.getWorkouts().then((w) => setWorkouts(Array.isArray(w) ? w : [])).catch(() => {})
    api.getMessages().then((m) => setMessages(Array.isArray(m) ? m : [])).catch(() => {})
  }
  useEffect(() => { if (view === 'home') reload() }, [view]) // fresh stats/unread whenever we land home
  useEffect(() => {
    // resumed from a push (standalone PWA doesn't remount) — refresh so the coach-notes badge isn't stale
    const onVis = () => { if (document.visibilityState === 'visible') reload() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])
  useEffect(() => { document.getElementById('root')?.scrollTo(0, 0) }, [view, activeIndex]) // #root is the scroller now
  useEffect(() => {
    if (!toast) return
    // the offline message matters more — give it longer on screen
    const t = setTimeout(() => setToast(null), toast.includes('online') ? 7000 : 3500)
    return () => clearTimeout(t)
  }, [toast])

  const go = (v: View) => {
    if (v === 'workout') {
      setSession(startSession(nextTemplate(workouts[0]?.template_key ?? null), workouts))
      setActiveIndex(null)
    }
    setView(v)
  }
  // immutable entry update so React re-renders
  const setEntry = (s: Session, index: number, patch: Partial<Session['entries'][number]>): Session =>
    ({ ...s, entries: s.entries.map((e, i) => (i === index ? { ...e, ...patch } : e)) })
  const finishEntry = (index: number, patch: Partial<Session['entries'][number]>) => {
    if (!session) return
    const next = setEntry(session, index, patch)
    setSession(next)
    const n = nextTodo(next, index)
    if (n === -1) setView('finish')
    else setActiveIndex(n)
  }

  if (splash) return <Splash onContinue={() => setSplash(false)} />
  let screen
  if (view === 'home') screen = <Home workouts={workouts} unread={messages.filter((m) => !m.read_at).length} go={go} />
  else if (view === 'workout' && session) {
    screen = activeIndex === null
      ? <Workout session={session} onOpen={setActiveIndex}
          onHome={() => { setSession(null); setView('home') }}
          onFinished={() => setView('finish')} />
      : <ExerciseCard key={activeIndex} session={session} index={activeIndex}
          onDone={(i, v) => finishEntry(i, { ...v, status: 'done' })}
          onSkip={(i) => finishEntry(i, { status: 'skipped' })}
          onList={() => setActiveIndex(null)} />
  } else if (view === 'finish' && session) {
    screen = <Finish session={session}
      onBack={() => { setActiveIndex(null); setView('workout') }}
      onSubmitted={(synced) => {
        setSession(null)
        setToast(synced ? 'Report filed. Chris has been alerted.' : 'Saved. It will send when you’re back online.')
        setView('home')
      }} />
  } else if (view === 'progress') {
    screen = <Progress workouts={workouts} onHome={() => setView('home')} />
  } else if (view === 'notes') {
    // CoachNotes marks all read on mount; landing back on 'home' triggers reload(), clearing the badge
    screen = <CoachNotes messages={messages} workouts={workouts} onHome={() => setView('home')} />
  } else screen = <Home workouts={workouts} unread={messages.filter((m) => !m.read_at).length} go={go} />

  return (
    <>
      {screen}
      {toast && (
        <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-navy px-5 py-3 text-center font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </>
  )
}
