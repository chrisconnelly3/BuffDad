import { serve } from '@hono/node-server'
import { openDb } from './db'
import { createApp } from './app'
import { initPush, sendPush } from './push'
import { TEMPLATES } from '../shared/templates'

// Fail closed: in production the token gate must never silently fall back to the
// public dev defaults. Crash loudly instead so a missing/cleared secret is obvious.
if (process.env.NODE_ENV === 'production') {
  for (const name of ['DAD_TOKEN', 'COACH_TOKEN'] as const) {
    const v = process.env[name]
    if (!v || v === 'dev-dad' || v === 'dev-coach')
      throw new Error(`${name} must be set to a non-default value in production`)
  }
}

const db = openDb(process.env.DB_PATH ?? './data.db')
const pushReady = initPush()
const templateName = (key: string) => TEMPLATES.find((t) => t.key === key)?.name ?? key
const app = createApp(db, {
  onWorkout: (w) => pushReady && sendPush(db, 'coach', 'BuffDad report',
    `Dad finished ${templateName(w.template_key)} — ${w.sets.length} exercise${w.sets.length === 1 ? '' : 's'}.`),
  onMessage: () => pushReady && sendPush(db, 'dad', 'Note from Chris', 'Your coach has spoken. Open BuffDad.'),
})
serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8787) })
console.log('BuffDad server on :' + (process.env.PORT ?? 8787))
