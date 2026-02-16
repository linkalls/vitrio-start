import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compilePath } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'

const seen: any[] = []

const routes: any[] = [
  {
    path: '/p/:id/*',
    _compiled: compilePath('/p/:id/*'),
    loader: async () => ({ ok: true }),
    component: ({ data }: any) => <div>{String(data.ok)}</div>,
  },
  {
    path: '/p/:id/x',
    _compiled: compilePath('/p/:id/x'),
    action: async (ctx: any) => {
      seen.push(ctx.params)
      return {}
    },
    component: ({ csrfToken }: any) => (
      <form method="post">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <button type="submit">go</button>
      </form>
    ),
  },
]

test('POST action receives merged params (parent + leaf)', async () => {
  seen.length = 0

  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, routes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  // GET to get csrf cookie
  const res1 = await app.request('http://local.test/p/123/x')
  const setCookie = res1.headers.get('set-cookie') || ''
  const m = setCookie.match(/vitrio_csrf=([^;]+)/)
  expect(m).toBeTruthy()
  const csrf = decodeURIComponent(m![1])

  // POST action
  const fd = new FormData()
  fd.set('_csrf', csrf)

  const res2 = await app.request('http://local.test/p/123/x', {
    method: 'POST',
    body: fd,
    headers: {
      cookie: `vitrio_csrf=${csrf}`,
    },
  })

  expect(res2.status).toBe(303)
  expect(seen.length).toBe(1)
  expect(seen[0]).toEqual({ id: '123' })
})
