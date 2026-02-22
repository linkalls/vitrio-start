import { test, expect } from 'bun:test'
import { compilePath } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'
import type { CompiledRouteDef } from '../src/routes'
import type { LoaderCtx } from '@potetotown/vitrio'

const calls = { parent: 0, leaf: 0 }

type ParentData = { parent: true; id: string }
type LeafData = { leaf: true; id: string }

const localRoutes: CompiledRouteDef[] = [
  {
    path: '/p/:id/*',
    _compiled: compilePath('/p/:id/*'),
    loader: async (ctx: LoaderCtx): Promise<ParentData> => {
      calls.parent++
      return { parent: true, id: ctx.params.id }
    },
    component: ({ data }) => <div>parent {String(data.parent)}</div>,
  },
  {
    path: '/p/:id/x',
    _compiled: compilePath('/p/:id/x'),
    loader: async (ctx: LoaderCtx): Promise<LeafData> => {
      calls.leaf++
      return { leaf: true, id: ctx.params.id }
    },
    component: ({ data }) => <div>leaf {String(data.leaf)}</div>,
  },
]

test('SSR primes all matching loaders (prefix + leaf) without double execution', async () => {
  calls.parent = 0
  calls.leaf = 0

  const res = await handleDocumentRequest(
    new Request('http://local.test/p/123/x'),
    localRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(200)

  // each loader runs once
  expect(calls.parent).toBe(1)
  expect(calls.leaf).toBe(1)
})
