import { test, expect } from 'bun:test'
import { compilePath } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'
import type { CompiledRouteDef } from '../src/routes'

// Local routes to count loader calls
const counter = { n: 0 }

type Data = { ok: boolean }

const localRoutes: CompiledRouteDef[] = [
  {
    path: '/x',
    _compiled: compilePath('/x'),
    loader: async (): Promise<Data> => {
      counter.n++
      return { ok: true }
    },
    component: ({ data }) => <div>{String(data.ok)}</div>,
  },
]

test('SSR primes loader cache (loader runs once)', async () => {
  counter.n = 0

  const res = await handleDocumentRequest(
    new Request('http://local.test/x'),
    localRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(200)
  const html = await res.text()
  expect(html).toContain('true')
  expect(counter.n).toBe(1)
})
