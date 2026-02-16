import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

test('GET loader can redirect', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/redir')
  expect(res.status).toBeGreaterThanOrEqual(300)
  expect(res.status).toBeLessThan(400)
  expect(res.headers.get('location')).toBe('/counter')
})

test('GET loader can mark notfound (404 status)', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/gone')
  expect(res.status).toBe(404)
})
