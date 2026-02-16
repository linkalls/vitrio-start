import { readdirSync, statSync, copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

const dist = join(process.cwd(), 'dist/client')
const assets = join(dist, 'assets')

mkdirSync(assets, { recursive: true })

const files = walk(assets)

// Heuristic: pick the largest JS module file as entry.
// (No magic import graph parsing; just a stable convention.)
const js = files.filter((f) => f.endsWith('.js'))

if (js.length === 0) {
  console.error('[fix-entry] No JS files found in dist/client/assets')
  process.exit(1)
}

let best = js[0]
let bestSize = statSync(best).size
for (const f of js) {
  const sz = statSync(f).size
  if (sz > bestSize) {
    best = f
    bestSize = sz
  }
}

const target = join(assets, 'entry.js')
copyFileSync(best, target)

console.log(`[fix-entry] entry.js <- ${best.replace(process.cwd() + '/', '')} (${bestSize} bytes)`) 
