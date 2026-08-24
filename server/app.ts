import { Hono } from 'hono'
import type { Context } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync, readFileSync } from 'node:fs'
import type { Db } from './db'
import type { Workout } from '../shared/types'

type Env = { Variables: { role: 'dad' | 'coach' } }

// Wrong token, no token, curious passersby: a polite bouncer. Still a 404, no hints.
const MEMBERS_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Members only</title>
<link rel="icon" href="/icons/favicon.svg">
<style>
  * { margin: 0; box-sizing: border-box }
  body {
    min-height: 100vh; display: grid; place-items: center; padding: 1.5rem;
    background: linear-gradient(180deg, #e8f4f8, #fdf6e3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  main {
    background: #fff; border-radius: 1.5rem; padding: 3rem 2.5rem; max-width: 24rem;
    text-align: center; box-shadow: 0 10px 30px rgba(26, 60, 80, .08);
  }
  h1 { color: #1a3c50; font-size: 1.5rem; font-weight: 900; letter-spacing: .25em; margin-top: 1.25rem }
  p { color: #4a6878; font-size: 1.05rem; line-height: 1.6; margin-top: .75rem }
</style>
</head>
<body>
<main>
  <svg width="96" height="24" viewBox="0 0 96 24" fill="none" aria-hidden="true">
    <path d="M4 10c7-6 15-6 22 0s15 6 22 0 15-6 22 0 15 6 22 0" stroke="#2a9d8f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M18 18c7-6 15-6 22 0s15 6 22 0 15-6 22 0" stroke="#1a3c50" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>
  </svg>
  <h1>MEMBERS ONLY</h1>
  <p>This is a private club. Extremely exclusive. Two members.</p>
</main>
</body>
</html>`

export function createApp(db: Db, hooks?: { onWorkout?: (w: Workout) => void; onMessage?: () => void }) {
  const app = new Hono<Env>()
  const DAD = process.env.DAD_TOKEN ?? 'dev-dad'
  const COACH = process.env.COACH_TOKEN ?? 'dev-coach'

  app.use('/api/*', async (c, next) => {
    const t = c.req.header('x-buffdad-token')
    if (t === DAD) c.set('role', 'dad')
    else if (t === COACH) c.set('role', 'coach')
    else return c.json({ error: 'members only' }, 401)
    await next()
  })

  app.get('/api/health', (c) => c.json({ ok: true }))

  app.post('/api/workouts', async (c) => {
    if (c.get('role') !== 'dad') return c.json({ error: 'dad only' }, 403)
    const w = (await c.req.json()) as Workout
    const insW = db.prepare('INSERT OR IGNORE INTO workouts (id,template_key,started_at,finished_at,feel_rating,note) VALUES (?,?,?,?,?,?)')
    const insS = db.prepare('INSERT OR IGNORE INTO workout_sets (id,workout_id,exercise_key,sets,reps,weight) VALUES (?,?,?,?,?,?)')
    let inserted = 0
    db.transaction(() => {
      inserted = insW.run(w.id, w.template_key, w.started_at, w.finished_at, w.feel_rating, w.note).changes
      for (const s of w.sets) insS.run(s.id, w.id, s.exercise_key, s.sets, s.reps, s.weight)
    })()
    if (inserted > 0) hooks?.onWorkout?.(w) // offline-queue retries must not re-notify
    return c.json({ ok: true })
  })

  app.get('/api/workouts', (c) => {
    const ws = db.prepare('SELECT * FROM workouts ORDER BY finished_at DESC').all() as any[]
    const sets = db.prepare('SELECT * FROM workout_sets').all() as any[]
    return c.json(ws.map((w) => ({ ...w, sets: sets.filter((s) => s.workout_id === w.id) })))
  })

  app.post('/api/messages', async (c) => {
    if (c.get('role') !== 'coach') return c.json({ error: 'coach only' }, 403)
    const { workout_id, body } = await c.req.json()
    if (!body?.trim()) return c.json({ error: 'empty' }, 400)
    if (!db.prepare('SELECT 1 FROM workouts WHERE id = ?').get(workout_id)) return c.json({ error: 'unknown workout' }, 400)
    db.prepare('INSERT INTO messages (id,workout_id,body,created_at) VALUES (?,?,?,?)')
      .run(crypto.randomUUID(), workout_id, body.trim(), new Date().toISOString())
    hooks?.onMessage?.()
    return c.json({ ok: true })
  })

  app.get('/api/messages', (c) => c.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all()))

  app.post('/api/messages/mark-read', (c) => {
    if (c.get('role') !== 'dad') return c.json({ error: 'dad only' }, 403)
    db.prepare('UPDATE messages SET read_at = ? WHERE read_at IS NULL').run(new Date().toISOString())
    return c.json({ ok: true })
  })

  app.post('/api/push/subscribe', async (c) => {
    const sub = await c.req.json()
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return c.json({ error: 'invalid subscription' }, 400)
    // id = endpoint so a device re-subscribing upserts instead of piling up duplicates
    db.prepare(`INSERT INTO push_subs (id,role,subscription,created_at) VALUES (?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET subscription=excluded.subscription, created_at=excluded.created_at`)
      .run(sub.endpoint, c.get('role'), JSON.stringify(sub), new Date().toISOString())
    return c.json({ ok: true })
  })
  app.get('/api/push/key', (c) => c.json({ key: process.env.VAPID_PUBLIC_KEY ?? null }))

  // per-role manifests: standalone PWA scoped to the tokened path
  const manifest = (path: string, name: string) => ({
    name, short_name: name, start_url: path, scope: path, display: 'standalone',
    background_color: '#e8f4f8', theme_color: '#2a9d8f',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  })
  app.get('/d/:token/manifest.webmanifest', (c) =>
    c.req.param('token') === DAD ? c.json(manifest(`/d/${DAD}/`, 'BuffDad')) : c.notFound())
  app.get('/coach/:token/manifest.webmanifest', (c) =>
    c.req.param('token') === COACH ? c.json(manifest(`/coach/${COACH}/`, 'BuffDad Coach')) : c.notFound())

  // production static + SPA serving — dev uses vite, so only when a build exists
  if (existsSync('./dist') || process.env.NODE_ENV === 'production') {
    for (const p of ['/assets/*', '/icons/*', '/sw.js', '/splash.jpg'])
      app.use(p, serveStatic({ root: './dist' }))
    let shellHtml: string | undefined
    const shell = (c: Context) => c.html((shellHtml ??= readFileSync('./dist/index.html', 'utf8')))
    const members = (c: Context) => c.html(MEMBERS_HTML, 404)
    app.get('/d/:token', (c) => (c.req.param('token') === DAD ? shell(c) : members(c)))
    app.get('/d/:token/*', (c) => (c.req.param('token') === DAD ? shell(c) : members(c)))
    app.get('/coach/:token', (c) => (c.req.param('token') === COACH ? shell(c) : members(c)))
    app.get('/coach/:token/*', (c) => (c.req.param('token') === COACH ? shell(c) : members(c)))
    app.get('/', members)
  }

  return app
}
