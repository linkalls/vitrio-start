import { Hono } from 'hono'
import { compiledRoutes } from '../routes'
import { handleDocumentRequest } from './framework'

// Cloudflare Workers entry.
// Note: Workers does not have Bun's file system. Serve assets via:
// - Cloudflare Pages (recommended) OR
// - Workers Static Assets (wrangler assets) if you wire it up.
// This worker focuses on SSR document responses.

const app = new Hono()

app.all('*', (c) =>
  handleDocumentRequest(c, compiledRoutes, {
    title: 'vitrio-start',
    // In Workers you should point this to your built client entry.
    // If using Pages/Vite build output, adjust accordingly.
    entrySrc: '/assets/entry.js',
  }),
)

export default app
