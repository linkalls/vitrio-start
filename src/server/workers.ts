import { Hono } from 'hono'
import { compiledRoutes } from '../routes'
import { handleDocumentRequest } from './framework'

// Cloudflare Workers entry.
// SSR lives in this Worker.
// Static assets are served via Wrangler Assets binding (see wrangler.toml).

type Env = Record<string, unknown> & {
  ASSETS?: { fetch: (req: Request) => Promise<Response> }
}

const app = new Hono<{ Bindings: Env }>()

// Serve built client assets (Vite output) from the assets binding.
app.get('/assets/*', async (c) => {
  if (!c.env.ASSETS) return c.notFound()
  return c.env.ASSETS.fetch(c.req.raw)
})

// Everything else: SSR
app.all('*', (c) =>
  handleDocumentRequest(c, compiledRoutes, {
    title: 'vitrio-start',
    entrySrc: '/assets/entry.js',
  }),
)

export default {
  fetch(request: Request, env: Env, ctx: any) {
    // Make env bindings available to non-handler modules (e.g. config.ts).
    ;(globalThis as any).__VITRIO_ENV = env
    return app.fetch(request, env, ctx)
  },
}
