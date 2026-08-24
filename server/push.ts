import webpush from 'web-push'
import type { Db } from './db'

export function initPush() {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:you@example.com', pub, priv)
  return true
}

// fire-and-forget; push failure must never fail a request
export function sendPush(db: Db, role: 'dad' | 'coach', title: string, body: string) {
  const rows = db.prepare('SELECT id, subscription FROM push_subs WHERE role = ?').all(role) as any[]
  for (const r of rows) {
    let sub
    try { sub = JSON.parse(r.subscription) } catch { db.prepare('DELETE FROM push_subs WHERE id = ?').run(r.id); continue }
    webpush.sendNotification(sub, JSON.stringify({ title, body })).catch((err) => {
      if (err?.statusCode === 410 || err?.statusCode === 404)
        db.prepare('DELETE FROM push_subs WHERE id = ?').run(r.id) // expired sub
      else console.error('push failed', err?.statusCode ?? err)
    })
  }
}
