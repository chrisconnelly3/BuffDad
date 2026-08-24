// One-shot: loading_screen.png -> public/splash.jpg (Task 13 extends this for icons).
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public', { recursive: true })
const out = await sharp('loading_screen.png')
  .resize({ height: 2000, withoutEnlargement: true }) // retina-friendly on a 844pt screen
  .jpeg({ quality: 80, mozjpeg: true }) // keep under 300KB
  .toFile('public/splash.jpg')
console.log(`public/splash.jpg ${out.width}x${out.height} ${(out.size / 1024).toFixed(0)}KB`)
