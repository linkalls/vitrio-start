import { test, expect } from 'bun:test'
import { Hono } from 'hono'
import { compilePath } from '../src/server/match'
import { handleDocumentRequest } from '../src/server/framework'

test('GET trailing slash redirects to normalized URL (301)', async () => {
  const routes: any[] = [
    {
      path: '/hello',
      _compiled: compilePath('/hello'),
      loader: async () => ({ ok: true }),
      component: ({ data }: any) => <div>{String(data.ok)}</div>,
    },
  ]

  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, routes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/hello/')
  expect(res.status).toBe(301)
  expect(res.headers.get('location')).toBe('/hello')
})

test('GET root "/" is not redirected', async () => {
  const routes: any[] = [
    {
      path: '/',
      _compiled: compilePath('/'),
      loader: async () => ({ ok: true }),
      component: ({ data }: any) => <div>{String(data.ok)}</div>,
    },
  ]

  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, routes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/')
  expect(res.status).toBe(200)
})

test('GET trailing slash preserves query string', async () => {
  const routes: any[] = [
    {
      path: '/search',
      _compiled: compilePath('/search'),
      loader: async () => ({ ok: true }),
      component: ({ data }: any) => <div>{String(data.ok)}</div>,
    },
  ]

  const app = new Hono()
  app.all('*', (c) =>
    handleDocumentRequest(c, routes as any, {
      title: 'test',
      entrySrc: '/src/client/entry.tsx',
    }),
  )

  const res = await app.request('http://local.test/search/?q=hello')
  expect(res.status).toBe(301)
  expect(res.headers.get('location')).toBe('/search?q=hello')
})
