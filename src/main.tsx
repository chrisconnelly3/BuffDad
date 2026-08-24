import { createRoot } from 'react-dom/client'
import App from './App'
import './theme.css'
import { flushQueue } from './api'

createRoot(document.getElementById('root')!).render(<App />)

flushQueue()
addEventListener('online', flushQueue)

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')

// per-role manifest lives under the tokened path; ignore any segments past the token
const [, seg, token] = location.pathname.split('/')
if ((seg === 'd' || seg === 'coach') && token) {
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = `/${seg}/${token}/manifest.webmanifest`
  document.head.appendChild(link)
}
