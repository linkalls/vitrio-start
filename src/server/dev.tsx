import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { compiledRoutes, fsApiRoutes } from '../routes'
import { handleDocumentRequest } from './framework'
import { mountApiRoutes } from './mount-api-routes'
import { config } from './config'

// Dev server: serve Vite source files directly (no bundling)
const app = new Hono()

app.use('/src/*', serveStatic({ root: '.' }))
app.use('/node_modules/*', serveStatic({ root: '.' }))
app.use('/@vite/*', serveStatic({ root: '.' }))

// File-based API routes (from src/pages/**/route.ts)
mountApiRoutes(app, fsApiRoutes)

app.all('*', (c) =>
  handleDocumentRequest(c, compiledRoutes, {
    title: 'vitrio-start (dev)',
    entrySrc: '/src/client/entry.tsx',
  }),
)

console.log('dev listening on', config.port)
Bun.serve({ port: config.port, fetch: app.fetch })
