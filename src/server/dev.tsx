import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { compiledRoutes } from '../routes'
import { handleDocumentRequest } from './framework'

// Dev server: serve Vite source files directly (no bundling)
const app = new Hono()

app.use('/src/*', serveStatic({ root: '.' }))
app.use('/node_modules/*', serveStatic({ root: '.' }))
app.use('/@vite/*', serveStatic({ root: '.' }))

app.all('*', (c) =>
  handleDocumentRequest(c, compiledRoutes as any, {
    title: 'vitrio-start (dev)',
    entrySrc: '/src/client/entry.tsx',
  }),
)

const port = Number(process.env.PORT || 3000)
console.log('dev listening on', port)
Bun.serve({ port, fetch: app.fetch })
