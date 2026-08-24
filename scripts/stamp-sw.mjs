// Stamp the service-worker cache name with a per-build id so each deploy uses a
// fresh cache and the activate handler can evict every older one.
import { readFileSync, writeFileSync } from 'node:fs'

const path = 'dist/sw.js'
const build = Date.now().toString(36)
const src = readFileSync(path, 'utf8')
if (!src.includes('__BUILD__')) throw new Error('sw.js has no __BUILD__ placeholder to stamp')
writeFileSync(path, src.replace('__BUILD__', build))
console.log(`stamped service worker cache: buffdad-${build}`)
