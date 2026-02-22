import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { compiledRoutes, fsApiRoutes } from '../routes'
import { handleDocumentRequest } from './framework'
import { mountApiRoutes } from './mount-api-routes'
import { config } from './config'

const app = new Hono()

// Static client assets (after `bun run build`)
// Serve with immutable cache headers for hashed assets
app.use('/assets/*', async (c, next) => {
  await next()
  // Add cache headers for built assets (they are content-hashed by Vite)
  if (c.res.status === 200) {
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
  }
})

app.use('/assets/*', serveStatic({ root: './dist/client' }))

// File-based API routes (from src/pages/**/route.ts)
mountApiRoutes(app, fsApiRoutes)

app.all('*', (c) =>
  handleDocumentRequest(c, compiledRoutes, {
    title: 'vitrio-start',
    entrySrc: '/src/client/entry.tsx',
  }),
)

export default app
