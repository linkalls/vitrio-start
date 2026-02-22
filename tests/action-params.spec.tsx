import { test, expect } from 'bun:test'
import { compilePath } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'
import type { CompiledRouteDef } from '../src/routes'
import type { LoaderCtx } from '@potetotown/vitrio'

const seen: Array<Record<string, string>> = []

type Ok = { ok: true }

const routes: CompiledRouteDef[] = [
  {
    path: '/p/:id/*',
    _compiled: compilePath('/p/:id/*'),
    loader: async (): Promise<Ok> => ({ ok: true }),
    component: ({ data }) => <div>{String(data.ok)}</div>,
  },
  {
    path: '/p/:id/x',
    _compiled: compilePath('/p/:id/x'),
    action: async (ctx: LoaderCtx): Promise<Record<string, never>> => {
      seen.push(ctx.params)
      return {}
    },
    component: ({ csrfToken }) => (
      <form method="post">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <button type="submit">go</button>
      </form>
    ),
  },
]

test('POST action receives merged params (parent + leaf)', async () => {
  seen.length = 0

  // GET to get csrf cookie
  const res1 = await handleDocumentRequest(
    new Request('http://local.test/p/123/x'),
    routes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  const setCookie = res1.headers.get('set-cookie') || ''
  const m = setCookie.match(/vitrio_csrf=([^;]+)/)
  expect(m).toBeTruthy()
  const csrf = decodeURIComponent(m![1])

  // POST action
  const fd = new FormData()
  fd.set('_csrf', csrf)

  const res2 = await handleDocumentRequest(
    new Request('http://local.test/p/123/x', {
      method: 'POST',
      body: fd,
      headers: { cookie: `vitrio_csrf=${csrf}` },
    }),
    routes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )

  expect(res2.status).toBe(303)
  expect(seen.length).toBe(1)
  expect(seen[0]).toEqual({ id: '123' })
})
