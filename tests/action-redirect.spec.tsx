import { test, expect } from 'bun:test'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

function pickCookie(setCookie: string | null, name: string) {
  if (!setCookie) return null
  const m = setCookie.match(new RegExp(`${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : null
}

test('POST action can redirect explicitly', async () => {
  // get csrf
  const res1 = await handleDocumentRequest(
    new Request('http://local.test/action-redirect'),
    compiledRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  const csrf = pickCookie(res1.headers.get('set-cookie'), 'vitrio_csrf')
  expect(csrf).toBeTruthy()

  // post
  const fd = new FormData()
  fd.set('_csrf', csrf!)
  const res2 = await handleDocumentRequest(
    new Request('http://local.test/action-redirect', {
      method: 'POST',
      body: fd,
      headers: { cookie: `vitrio_csrf=${csrf}` },
    }),
    compiledRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )

  expect(res2.status).toBe(303)
  expect(res2.headers.get('location')).toBe('/')
})
