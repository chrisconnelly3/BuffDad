import { TOKEN } from './session-ctx'

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// iOS Safari (dad's browser) is pickier than Chrome about string keys — always pass bytes
function urlBase64ToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (ch) => ch.charCodeAt(0))
}

export async function enablePush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready
    const { key } = await fetch('/api/push/key', { headers: { 'x-buffdad-token': TOKEN } }).then((r) => r.json())
    if (!key) return false
    if (await Notification.requestPermission() !== 'granted') return false
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
    const r = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'x-buffdad-token': TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify(sub),
    })
    return r.ok
  } catch (err) {
    console.error('push enable failed', err)
    return false
  }
}
