import { compiledRoutes, fsApiRoutes } from '../routes'
import { handleDocumentRequest } from './framework'
import { handleApiRoutes } from './mount-api-routes'

// Cloudflare Workers entry.
// SSR lives in this Worker.
// Static assets are served via Wrangler Assets binding (see wrangler.toml).

type Env = Record<string, unknown> & {
  ASSETS?: { fetch: (req: Request) => Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env, _ctx: unknown): Promise<Response> {
    // Make env bindings available to non-handler modules (e.g. config.ts).
    ;(globalThis as any).__VITRIO_ENV = env

    const url = new URL(request.url)

    // Serve built client assets from the assets binding.
    if (url.pathname.startsWith('/assets/') && env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    // File-based API routes (from src/pages/**/route.ts)
    const apiResponse = await handleApiRoutes(request, fsApiRoutes)
    if (apiResponse) return apiResponse

    // Everything else: SSR
    return handleDocumentRequest(request, compiledRoutes, {
      title: 'vitrio-start',
      entrySrc: '/assets/entry.js',
    })
  },
}
