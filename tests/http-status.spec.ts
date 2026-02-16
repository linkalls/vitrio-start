import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

test('GET unknown path returns 404 status (document)', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/does-not-exist')
  expect(res.status).toBe(404)
  const html = await res.text()
  expect(html).toContain('<div id="app">')
})

test('GET known path returns 200 status', async () => {
  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, compiledRoutes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/counter')
  expect(res.status).toBe(200)
})
