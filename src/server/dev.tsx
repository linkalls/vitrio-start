import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { getCookie, setCookie } from 'hono/cookie'
import { renderToStringAsync } from '@potetotown/vitrio/server'
import { App } from './app'
import { dehydrateLoaderCache, v, matchPath } from '@potetotown/vitrio'
import { routes } from '../routes'

// Dev server: serve Vite source files directly (no bundling)
const app = new Hono()

app.use('/src/*', serveStatic({ root: '.' }))
app.use('/node_modules/*', serveStatic({ root: '.' }))
app.use('/@vite/*', serveStatic({ root: '.' }))

app.all('*', async (c) => {
  const method = c.req.method
  const url = new URL(c.req.url)
  const path = url.pathname

  // 1. Handle POST Actions
  if (method === 'POST') {
    for (const r of routes) {
      const params = matchPath(r.path, path)
      if (params && r.action) {
        // Found matching action
        const formData = await c.req.formData()
        const ctx = { params, search: url.searchParams, location: { path, query: url.search, hash: url.hash } }
        
        try {
          await r.action(ctx, formData)
          console.log('Action executed successfully')
          setCookie(c, 'vitrio_flash', JSON.stringify({ ok: true, at: Date.now() }), {
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
          })
        } catch (e) {
          console.error('Action failed', e)
          setCookie(c, 'vitrio_flash', JSON.stringify({ ok: false, at: Date.now() }), {
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
          })
        }

        // PRG: POST -> redirect -> GET
        return c.redirect(path, 303)
      }
    }
  }

  // 2. Render
  const locAtom = v({ path, query: url.search, hash: url.hash })
  const cacheMap = new Map<string, any>()

  const body = await renderToStringAsync(
    <App path={c.req.path} locationAtom={locAtom} loaderCache={cacheMap} />,
  )
  const cache = dehydrateLoaderCache(cacheMap as any)

  // Flash cookie (1-shot)
  const flashRaw = getCookie(c, 'vitrio_flash')
  if (flashRaw) {
    setCookie(c, 'vitrio_flash', '', { path: '/', maxAge: 0 })
  }

  return c.html(`<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>vitrio-start (dev)</title>
  </head>
  <body>
    <div id="app">${body}</div>
    <script>globalThis.__VITRIO_LOADER_CACHE__ = ${JSON.stringify(cache)};</script>
    <script>globalThis.__VITRIO_FLASH__ = ${JSON.stringify(flashRaw ? JSON.parse(flashRaw) : null)};</script>
    <script type="module" src="/src/client/entry.tsx"></script>
  </body>
</html>`)
})

const port = Number(process.env.PORT || 3000)
console.log('dev listening on', port)
Bun.serve({ port, fetch: app.fetch })
