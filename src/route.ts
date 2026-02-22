import type { LoaderCtx, ActionApi } from '@potetotown/vitrio'
import { compilePath, type CompiledPath } from './server/match'

/**
 * Per-page metadata exported from page files.
 * Used to generate <title>, <meta> tags, etc. in the HTML document head.
 *
 * @example
 * // src/pages/about/page.tsx
 * export const metadata: PageMetadata = {
 *   title: 'About',
 *   description: 'About vitrio-start',
 * }
 */
export interface PageMetadata {
  /** Page title — rendered as "<title> | site-name" */
  title?: string
  /** <meta name="description"> */
  description?: string
  /** <meta name="keywords"> */
  keywords?: string
  /** Open Graph tags */
  openGraph?: {
    title?: string
    description?: string
    image?: string
    type?: string
  }
  /** <link rel="canonical"> */
  canonical?: string
  /** Add <meta name="robots" content="noindex, nofollow"> */
  noIndex?: boolean
}

export interface RouteDef {
  path: string
  /**
   * Enable client-side JS for this route ("use client"-style).
   * Default is SSR-only: fully usable without JS.
   */
  client?: boolean
  /** Per-page metadata for the HTML document head (title, description, OG, etc.) */
  metadata?: PageMetadata
  loader?: (ctx: LoaderCtx) => Promise<unknown> | unknown
  action?: (ctx: LoaderCtx, formData: FormData) => Promise<unknown> | unknown
  component: (props: {
    data: unknown
    action: ActionApi<FormData, unknown>
    csrfToken: string
  }) => unknown
}

export type CompiledRouteDef = RouteDef & { _compiled: CompiledPath }

/**
 * Handler function for API routes (route.ts files).
 * Receives a standard Web API Request and returns a Response.
 */
export type ApiHandler = (request: Request) => Response | Promise<Response>

/**
 * API route definition — generated from src/pages/**/route.ts files.
 * Export GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS from a route.ts file
 * to handle the corresponding HTTP methods as a JSON API endpoint.
 *
 * @example
 * // src/pages/api/users/route.ts
 * export async function GET(request: Request) {
 *   return Response.json({ users: [] })
 * }
 */
export interface ApiRouteDef {
  path: string
  GET?: ApiHandler
  POST?: ApiHandler
  PUT?: ApiHandler
  PATCH?: ApiHandler
  DELETE?: ApiHandler
  HEAD?: ApiHandler
  OPTIONS?: ApiHandler
}

export function defineRoute(route: RouteDef): RouteDef {
  return route
}

export function compileRoutes(routes: RouteDef[]): CompiledRouteDef[] {
  return routes.map((r) => ({
    ...r,
    _compiled: compilePath(r.path),
  }))
}
