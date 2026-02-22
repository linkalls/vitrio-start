import type { ApiRouteDef } from '../route'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

/**
 * Handle file-based API routes (from src/pages/**/route.ts).
 * Returns a Response if a route matches, or null if no route matches.
 * Called in each server entry (index.tsx, dev.tsx, workers.ts, netlify.ts).
 */
export async function handleApiRoutes(
  request: Request,
  routes: ApiRouteDef[],
): Promise<Response | null> {
  const url = new URL(request.url)
  const method = request.method.toUpperCase() as (typeof HTTP_METHODS)[number]

  for (const route of routes) {
    if (url.pathname === route.path) {
      const handler = (route as any)[method]
      if (typeof handler === 'function') {
        return await handler(request)
      }
      return new Response('Method Not Allowed', { status: 405 })
    }
  }

  return null
}
