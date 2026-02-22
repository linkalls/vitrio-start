import type { Hono } from 'hono'
import type { ApiRouteDef } from '../route'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

/**
 * Mount file-based API routes (from src/pages/**/route.ts) on a Hono app.
 * Called in each server entry (index.tsx, dev.tsx, workers.ts, netlify.ts).
 */
export function mountApiRoutes(app: Hono<any>, routes: ApiRouteDef[]): void {
  for (const route of routes) {
    for (const method of HTTP_METHODS) {
      const handler = (route as any)[method]
      if (typeof handler === 'function') {
        ;(app as any)[method.toLowerCase()](route.path, handler)
      }
    }
  }
}
