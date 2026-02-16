import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { compiledRoutes } from '../routes'
import { handleDocumentRequest } from './framework'
import { config } from './config'

const app = new Hono()

// Static client assets (after `bun run build`)
app.use('/assets/*', serveStatic({ root: './dist/client' }))

app.all('*', (c) =>
  handleDocumentRequest(c, compiledRoutes as any, {
    title: 'vitrio-start',
    entrySrc: '/src/client/entry.tsx',
  }),
)

export default app

if (import.meta.main) {
  console.log('listening on', config.port)
  Bun.serve({
    port: config.port,
    fetch: app.fetch,
  })
}
