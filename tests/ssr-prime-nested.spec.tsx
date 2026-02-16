import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compilePath } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'

const calls = { parent: 0, leaf: 0 }

const localRoutes: any[] = [
  {
    path: '/p/*',
    _compiled: compilePath('/p/*'),
    loader: async () => {
      calls.parent++
      return { parent: true }
    },
    component: ({ data }: any) => <div>parent {String(data.parent)}</div>,
  },
  {
    path: '/p/x',
    _compiled: compilePath('/p/x'),
    loader: async () => {
      calls.leaf++
      return { leaf: true }
    },
    component: ({ data }: any) => <div>leaf {String(data.leaf)}</div>,
  },
]

test('SSR primes all matching loaders (prefix + leaf) without double execution', async () => {
  calls.parent = 0
  calls.leaf = 0

  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, localRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/p/x')
  expect(res.status).toBe(200)

  // each loader runs once
  expect(calls.parent).toBe(1)
  expect(calls.leaf).toBe(1)
})
