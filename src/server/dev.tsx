import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { compiledRoutes } from '../routes'
import { handleDocumentRequest } from './framework'
import { config } from './config'

// Dev server: serve Vite source files directly (no bundling)
const app = new Hono()

app.use('/src/*', serveStatic({ root: '.' }))
app.use('/node_modules/*', serveStatic({ root: '.' }))
app.use('/@vite/*', serveStatic({ root: '.' }))

app.all('*', (c) =>
  handleDocumentRequest(c, compiledRoutes, {
    title: 'vitrio-start (dev)',
    entrySrc: '/src/client/entry.tsx',
  }),
)

console.log('dev listening on', config.port)
Bun.serve({ port: config.port, fetch: app.fetch })
