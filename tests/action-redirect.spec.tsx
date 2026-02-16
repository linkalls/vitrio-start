import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

function pickCookie(setCookie: string | null, name: string) {
  if (!setCookie) return null
  const m = setCookie.match(new RegExp(`${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : null
}

test('POST action can redirect explicitly', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  // get csrf
  const res1 = await app.request('http://local.test/action-redirect')
  const csrf = pickCookie(res1.headers.get('set-cookie'), 'vitrio_csrf')
  expect(csrf).toBeTruthy()

  // post
  const fd = new FormData()
  fd.set('_csrf', csrf!)
  const res2 = await app.request('http://local.test/action-redirect', {
    method: 'POST',
    body: fd,
    headers: { cookie: `vitrio_csrf=${csrf}` },
  })

  expect(res2.status).toBe(303)
  expect(res2.headers.get('location')).toBe('/')
})
