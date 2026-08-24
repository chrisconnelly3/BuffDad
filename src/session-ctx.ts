// path: /d/<token>[/...] or /coach/<token>
const path = typeof location !== 'undefined' ? location.pathname : ''
const [, seg, token] = path.split('/')
export const ROLE = seg === 'coach' ? 'coach' : 'dad'
export const TOKEN = token ?? ''
