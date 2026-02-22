import { test, expect } from 'bun:test'
import { compilePath } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'

test('Loader that throws returns 500', async () => {
  const routes = [
    {
      path: '/boom',
      _compiled: compilePath('/boom'),
      loader: async (): Promise<never> => {
        throw new Error('database connection failed')
      },
      component: () => <div>never rendered</div>,
    },
  ]

  const res = await handleDocumentRequest(
    new Request('http://local.test/boom'),
    routes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(500)
  const html = await res.text()
  expect(html).toContain('500 Internal Server Error')
  // In non-prod, the error message should be visible
  expect(html).toContain('database connection failed')
})
