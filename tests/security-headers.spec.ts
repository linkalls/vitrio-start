import { test, expect } from 'bun:test'
import { compiledRoutes } from '../src/routes'
import { handleDocumentRequest } from '../src/server/framework'

test('Document response includes security headers', async () => {
  const res = await handleDocumentRequest(
    new Request('http://local.test/counter'),
    compiledRoutes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(200)

  expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  expect(res.headers.get('content-security-policy')).toContain("default-src 'self'")
})
