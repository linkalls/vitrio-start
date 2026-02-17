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

// Pick the Vite entry chunk (index-*.js). The assets directory may contain
// many additional chunks; choosing "largest JS" breaks when code-splitting exists.
const js = files.filter((f) => f.endsWith('.js'))
const indexJs = js.filter((f) => /\/assets\/index-.*\.js$/.test(f.replace(/\\/g, '/')))

if (indexJs.length === 0) {
  console.error('[fix-entry] No index-*.js found in dist/client/assets')
  console.error(`[fix-entry] Found JS files: ${js.length}`)
  process.exit(1)
}

// If multiple index chunks exist, pick the largest among them.
let best = indexJs[0]
let bestSize = statSync(best).size
for (const f of indexJs) {
  const sz = statSync(f).size
  if (sz > bestSize) {
    best = f
    bestSize = sz
  }
}

const target = join(assets, 'entry.js')
copyFileSync(best, target)

console.log(`[fix-entry] entry.js <- ${best.replace(process.cwd() + '/', '')} (${bestSize} bytes)`) 
