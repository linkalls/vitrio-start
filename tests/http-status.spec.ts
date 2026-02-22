import { test, expect } from 'bun:test'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

test('GET unknown path returns 404 status (document)', async () => {
  const res = await handleDocumentRequest(
    new Request('http://local.test/does-not-exist'),
    compiledRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(404)
  const html = await res.text()
  expect(html).toContain('<div id="app">')
})

test('GET known path returns 200 status', async () => {
  const res = await handleDocumentRequest(
    new Request('http://local.test/counter'),
    compiledRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(200)
})
