// One-shot: render the BuffDad app icon — a bold white dumbbell over a beach wave
// on teal — to public/icons/{icon-180,icon-192,icon-512}.png + favicon.svg.
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

// rx: corner radius — 0 for PNGs (iOS masks its own), rounded for the favicon.
const motif = (rx) => `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="${rx}" fill="#2a9d8f"/>
  <!-- dumbbell: two plates + handle, read instantly as "workout" -->
  <g fill="#ffffff">
    <rect x="150" y="196" width="46" height="104" rx="18"/>   <!-- left outer plate -->
    <rect x="196" y="212" width="26" height="72" rx="12"/>    <!-- left inner plate -->
    <rect x="216" y="234" width="80" height="28" rx="14"/>    <!-- handle -->
    <rect x="290" y="212" width="26" height="72" rx="12"/>    <!-- right inner plate -->
    <rect x="316" y="196" width="46" height="104" rx="18"/>   <!-- right outer plate -->
  </g>
  <!-- beach wave beneath, keeps the Beach Club identity -->
  <path d="M108 372 c30 -40 60 -40 90 0 s60 40 90 0 s60 -40 90 0"
        stroke="#ffffff" stroke-width="22" stroke-linecap="round" fill="none" opacity="0.92"/>
</svg>`

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/favicon.svg', motif(96))
console.log('public/icons/favicon.svg')
for (const size of [180, 192, 512]) {
  const out = await sharp(Buffer.from(motif(0))).resize(size, size).png().toFile(`public/icons/icon-${size}.png`)
  console.log(`public/icons/icon-${size}.png ${out.width}x${out.height}`)
}
