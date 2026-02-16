import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderToString } from '@potetotown/vitrio/server'
import { App } from './app'

const app = new Hono()

// Static client assets (after `bun run build`)
app.use('/assets/*', serveStatic({ root: './dist/client' }))

app.get('*', (c) => {
  const body = renderToString(<App path={c.req.path} />)

  return c.html(`<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>vitrio-start</title>
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/client/entry.tsx"></script>
  </body>
</html>`)
})

export default app

if (import.meta.main) {
  const port = Number(process.env.PORT || 3000)
  console.log('listening on', port)
  Bun.serve({
    port,
    fetch: app.fetch,
  })
}
