const CACHE = 'buffdad-__BUILD__' // stamped per build (scripts/stamp-sw.mjs) so each deploy gets a fresh cache
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // drop every prior build's cache so old hashed assets can't accumulate forever
  const names = await caches.keys()
  await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
  await clients.claim()
})()))

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname === '/splash.jpg') {
    // cache-first: hashed/immutable-ish assets
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request)
      if (hit) return hit
      const r = await fetch(e.request)
      if (r.ok) c.put(e.request, r.clone()) // clone before the browser consumes the body
      return r
    }))
  } else if (e.request.mode === 'navigate') {
    // network-first with offline fallback to last good shell
    e.respondWith(fetch(e.request).then((r) => {
      if (r.ok) {
        const copy = r.clone() // clone synchronously, before respondWith starts streaming the body
        caches.open(CACHE).then((c) => {
          c.put('/offline-shell', copy)
          c.put('/last-path', new Response(url.pathname)) // notificationclick must reopen the tokened app, not the members page
        })
      }
      return r
    }).catch(async () => (await caches.match('/offline-shell')) ?? Response.error()))
  }
})

self.addEventListener('push', (e) => {
  // always show something — iOS penalizes subscriptions whose pushes render no notification
  let title = 'BuffDad', body = 'Something happened. Open the app.'
  try { ({ title, body } = e.data.json()) } catch {}
  e.waitUntil(self.registration.showNotification(title, { body, icon: '/icons/icon-192.png' }))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (ws) => {
    if (ws[0]) return ws[0].focus()
    const hit = await caches.match('/last-path')
    return clients.openWindow(hit ? await hit.text() : '/')
  }))
})
