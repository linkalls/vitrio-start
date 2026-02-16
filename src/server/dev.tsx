import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderToStringAsync } from '@potetotown/vitrio/server'
import { App } from './app'
import { dehydrateLoaderCache, hydrateLoaderCache } from '@potetotown/vitrio'

// Dev server: serve Vite source files directly (no bundling)
const app = new Hono()

app.use('/src/*', serveStatic({ root: '.' }))
app.use('/node_modules/*', serveStatic({ root: '.' }))
app.use('/@vite/*', serveStatic({ root: '.' }))

app.get('*', async (c) => {
  hydrateLoaderCache({})
  const body = await renderToStringAsync(<App path={c.req.path} />)
  const cache = dehydrateLoaderCache()

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
    <script type="module" src="/src/client/entry.tsx"></script>
  </body>
</html>`)
})

const port = Number(process.env.PORT || 3000)
console.log('dev listening on', port)
Bun.serve({ port, fetch: app.fetch })
