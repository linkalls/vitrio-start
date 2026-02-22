import { test, expect } from 'bun:test'
import { compilePath } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'

test('GET trailing slash redirects to normalized URL (301)', async () => {
  const routes = [
    {
      path: '/hello',
      _compiled: compilePath('/hello'),
      loader: async (): Promise<{ ok: true }> => ({ ok: true }),
      component: ({ data }: { data: { ok: true } }) => <div>{String(data.ok)}</div>,
    },
  ]

  const res = await handleDocumentRequest(
    new Request('http://local.test/hello/'),
    routes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(301)
  expect(res.headers.get('location')).toBe('/hello')
})

test('GET root "/" is not redirected', async () => {
  const routes = [
    {
      path: '/',
      _compiled: compilePath('/'),
      loader: async (): Promise<{ ok: true }> => ({ ok: true }),
      component: ({ data }: { data: { ok: true } }) => <div>{String(data.ok)}</div>,
    },
  ]

  const res = await handleDocumentRequest(
    new Request('http://local.test/'),
    routes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(200)
})

test('GET trailing slash preserves query string', async () => {
  const routes = [
    {
      path: '/search',
      _compiled: compilePath('/search'),
      loader: async (): Promise<{ ok: true }> => ({ ok: true }),
      component: ({ data }: { data: { ok: true } }) => <div>{String(data.ok)}</div>,
    },
  ]

  const res = await handleDocumentRequest(
    new Request('http://local.test/search/?q=hello'),
    routes,
    { title: 'test', entrySrc: '/src/client/entry.tsx' },
  )
  expect(res.status).toBe(301)
  expect(res.headers.get('location')).toBe('/search?q=hello')
})
