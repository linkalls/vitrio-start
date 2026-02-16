import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { routes } from '../routes'
import { handleDocumentRequest } from './framework'

const app = new Hono()

// Static client assets (after `bun run build`)
app.use('/assets/*', serveStatic({ root: './dist/client' }))

app.all('*', (c) =>
  handleDocumentRequest(c, routes, {
    title: 'vitrio-start',
    entrySrc: '/src/client/entry.tsx',
  }),
)

export default app

if (import.meta.main) {
  const port = Number(process.env.PORT || 3000)
  console.log('listening on', port)
  Bun.serve({
    port,
    fetch: app.fetch,
  })
}
