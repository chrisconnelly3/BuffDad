import { useState } from 'react'
import BigButton from './BigButton'
import { pushSupported, enablePush } from '../push-client'

const DISMISS_KEY = 'buffdad-push-dismissed'

export default function PushCard({ prompt }: { prompt: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle')
  const [hidden, setHidden] = useState(() =>
    !pushSupported() || Notification.permission === 'granted' || !!localStorage.getItem(DISMISS_KEY))
  if (hidden) return null

  const dismiss = () => { localStorage.setItem(DISMISS_KEY, '1'); setHidden(true) }
  const turnOn = async () => {
    setState('busy')
    setState((await enablePush()) ? 'done' : 'failed')
  }

  return (
    <div className="mt-2 rounded-2xl bg-white p-4 shadow-lg shadow-navy/5">
      {state === 'done' ? (
        <p className="text-lg font-extrabold text-navy">Done. We’ll keep it brief.</p>
      ) : (
        <>
          <p className="text-lg font-extrabold text-navy">{prompt}</p>
          {state === 'failed' && <p className="mt-1 text-muted">That didn’t take. It happens.</p>}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1"><BigButton onClick={turnOn} disabled={state === 'busy'}>Turn on notifications</BigButton></div>
            <button onClick={dismiss} className="min-h-14 shrink-0 px-3 text-center font-semibold text-muted">
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  )
}
