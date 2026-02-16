import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

function getSetCookies(res: Response): string[] {
  // Bun currently returns a combined header string in many cases
  const raw = res.headers.get('set-cookie')
  if (!raw) return []
  // naive split; good enough for our simple cookies
  return raw.split(/,(?=[^;]+?=)/g).map((s) => s.trim())
}

function findCookie(setCookies: string[], name: string): string | null {
  const hit = setCookies.find((c) => c.startsWith(name + '='))
  if (!hit) return null
  const raw = hit.split(';')[0].slice((name + '=').length)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

test('GET sets csrf cookie and returns HTML', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/counter')
  expect(res.status).toBe(200)

  const setCookies = getSetCookies(res)
  const csrf = findCookie(setCookies, 'vitrio_csrf')
  expect(csrf).toBeTruthy()

  const html = await res.text()
  expect(html).toContain('<div id="app">')
  expect(html).toContain('__VITRIO_LOADER_CACHE__')
})

test('POST without csrf does not run action and still redirects (flash=false)', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const fd = new FormData()
  fd.set('amount', '5')

  const res = await app.request('http://local.test/counter', {
    method: 'POST',
    body: fd,
  })

  expect(res.status).toBe(303)
  expect(res.headers.get('location')).toBe('/counter')

  const setCookies = getSetCookies(res)
  const flash = findCookie(setCookies, 'vitrio_flash')
  expect(flash).toBeTruthy()
  expect(flash!).toContain('"ok":false')
})

test('POST with csrf redirects and sets flash=true', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  // 1) GET to obtain csrf cookie
  const res1 = await app.request('http://local.test/counter')
  const csrf = findCookie(getSetCookies(res1), 'vitrio_csrf')
  expect(csrf).toBeTruthy()

  // 2) POST with cookie + hidden field
  const fd = new FormData()
  fd.set('_csrf', csrf!)
  fd.set('amount', '5')

  const res2 = await app.request('http://local.test/counter', {
    method: 'POST',
    body: fd,
    headers: {
      cookie: `vitrio_csrf=${csrf}`,
    },
  })

  expect(res2.status).toBe(303)
  const flash = findCookie(getSetCookies(res2), 'vitrio_flash')
  expect(flash).toBeTruthy()
  expect(flash!).toContain('"ok":true')
})
