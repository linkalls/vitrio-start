import { test, expect } from 'bun:test'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

test('GET loader can redirect', async () => {
  const res = await handleDocumentRequest(
    new Request('http://local.test/redir'),
    compiledRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBeGreaterThanOrEqual(300)
  expect(res.status).toBeLessThan(400)
  expect(res.headers.get('location')).toBe('/counter')
})

test('GET loader can mark notfound (404 status)', async () => {
  const res = await handleDocumentRequest(
    new Request('http://local.test/gone'),
    compiledRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(404)
})
