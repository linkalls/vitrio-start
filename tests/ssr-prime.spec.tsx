import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compilePath, matchCompiled } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'

// Local routes to count loader calls
const counter = { n: 0 }

const localRoutes: any[] = [
  {
    path: '/x',
    _compiled: compilePath('/x'),
    loader: async () => {
      counter.n++
      return { ok: true }
    },
    component: ({ data }: any) => <div>{String(data.ok)}</div>,
  },
]

test('SSR primes loader cache (loader runs once)', async () => {
  counter.n = 0

  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, localRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/x')
  expect(res.status).toBe(200)
  const html = await res.text()
  expect(html).toContain('true')
  expect(counter.n).toBe(1)
})
