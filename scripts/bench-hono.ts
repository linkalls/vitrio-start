import { Hono } from 'hono'
import { compilePath, matchCompiled } from '../src/server/match'

function now() {
  return performance.now()
}

function fmt(ms: number) {
  return `${ms.toFixed(2)}ms`
}

function ops(iters: number, ms: number) {
  return `${Math.round((iters / ms) * 1000).toLocaleString()} ops/sec`
}

const patterns = [
  '/',
  '/counter',
  '/users/:id',
  '/users/:id/posts/:postId',
  '/nested/:parent/*',
]

const paths = [
  '/',
  '/counter',
  '/users/123',
  '/users/123/posts/999',
  '/nested/abc/child/zzz',
]

// --- Our matcher (sync, hot) ---
const compiled = patterns.map((p) => compilePath(p))
let idx = 0

// warm
for (let i = 0; i < 50_000; i++) {
  matchCompiled(compiled[idx % compiled.length], paths[idx % paths.length])
  idx++
}

idx = 0
const itersMatcher = 1_000_000
const t0 = now()
for (let i = 0; i < itersMatcher; i++) {
  matchCompiled(compiled[idx % compiled.length], paths[idx % paths.length])
  idx++
}
const t1 = now()
console.log(`matchCompiled: ${fmt(t1 - t0)} (${ops(itersMatcher, t1 - t0)})`)

// --- Hono router dispatch (includes middleware/context overhead) ---
const app = new Hono()
const ok = () => new Response('ok')

app.get('/', ok)
app.get('/counter', ok)
app.get('/users/:id', ok)
app.get('/users/:id/posts/:postId', ok)
app.get('/nested/:parent/*', ok)

const reqs = paths.map((p) => new Request(`http://local.test${p}`, { method: 'GET' }))

// warm
for (let i = 0; i < 1000; i++) {
  await app.fetch(reqs[i % reqs.length])
}

const itersHono = 50_000
const h0 = now()
for (let i = 0; i < itersHono; i++) {
  await app.fetch(reqs[i % reqs.length])
}
const h1 = now()
console.log(`hono.fetch (GET dispatch): ${fmt(h1 - h0)} (${ops(itersHono, h1 - h0)})`)

console.log('NOTE: hono.fetch includes request/context overhead; not a pure path-match micro-benchmark.')
