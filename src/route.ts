import type { LoaderCtx, ActionApi } from '@potetotown/vitrio'
import { compilePath, type CompiledPath } from './server/match'

export interface RouteDef {
  path: string
  /**
   * Enable client-side JS for this route ("use client"-style).
   * Default is SSR-only: fully usable without JS.
   */
  client?: boolean
  loader?: (ctx: LoaderCtx) => Promise<unknown> | unknown
  action?: (ctx: LoaderCtx, formData: FormData) => Promise<unknown> | unknown
  component: (props: {
    data: unknown
    action: ActionApi<FormData, unknown>
    csrfToken: string
  }) => unknown
}

export type CompiledRouteDef = RouteDef & { _compiled: CompiledPath }

export function defineRoute(route: RouteDef): RouteDef {
  return route
}

export function compileRoutes(routes: RouteDef[]): CompiledRouteDef[] {
  return routes.map((r) => ({
    ...r,
    _compiled: compilePath(r.path),
  }))
}
