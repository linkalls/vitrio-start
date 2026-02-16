import { matchPath } from '@potetotown/vitrio'
import { compilePath, matchCompiled } from '../src/server/match'

function now() {
  return performance.now()
}

function fmt(ms: number) {
  return `${ms.toFixed(2)}ms`
}

function bench(name: string, fn: () => void) {
  // warm
  for (let i = 0; i < 10_000; i++) fn()

  const t0 = now()
  for (let i = 0; i < 1_000_000; i++) fn()
  const t1 = now()
  const dt = t1 - t0
  console.log(`${name}: ${fmt(dt)}`)
  return dt
}

// patterns
const patterns = [
  '/',
  '/counter',
  '/users/:id',
  '/users/:id/posts/:postId',
  '/nested/:parent/*',
]

const compiled = patterns.map((p) => compilePath(p))

const paths = [
  '/',
  '/counter',
  '/users/123',
  '/users/123/posts/999',
  '/nested/abc/child/zzz',
]

// a predictable workload
let idx = 0

bench('matchPath (split pattern every call)', () => {
  const p = patterns[idx % patterns.length]
  const path = paths[idx % paths.length]
  matchPath(p, path)
  idx++
})

idx = 0
bench('matchCompiled (pattern pre-split)', () => {
  const c = compiled[idx % compiled.length]
  const path = paths[idx % paths.length]
  matchCompiled(c, path)
  idx++
})

// correctness quick check
for (let i = 0; i < patterns.length; i++) {
  const a = matchPath(patterns[i], paths[i])
  const b = matchCompiled(compiled[i], paths[i])
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.error('Mismatch', patterns[i], paths[i], a, b)
    process.exit(1)
  }
}
console.log('OK')
