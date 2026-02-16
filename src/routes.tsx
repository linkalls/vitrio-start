import type { RouteLoader, RouteAction, ActionApi } from '@potetotown/vitrio'
import { z } from 'zod'
import { parseFormData } from './server/form'
import { compilePath, type CompiledPath } from './server/match'
import { redirect, notFound, type RedirectResult, type NotFoundResult } from './server/response'

// Loader result type - can return data or special responses
export type LoaderResult<T = unknown> = RedirectResult | NotFoundResult | T

// Action result type - can return data or special responses
export type ActionResult<T = unknown> = RedirectResult | NotFoundResult | T

// Minimal route definition type
export interface RouteDef<
  TLoaderData = any,
  TActionData = any
> {
  path: string
  loader?: (ctx: any) => Promise<LoaderResult<TLoaderData>> | LoaderResult<TLoaderData>
  action?: (ctx: any, formData: FormData) => Promise<ActionResult<TActionData>> | ActionResult<TActionData>
  component: (props: {
    data: TLoaderData
    action: ActionApi<TActionData>
    csrfToken: string
  }) => any
}

export type CompiledRouteDef = RouteDef & { _compiled: CompiledPath }

/**
 * Helper to define a route with better type inference.
 * 
 * Usage:
 *   const myRoute = defineRoute({
 *     path: '/users/:id',
 *     loader: async (ctx) => ({ user: ... }),
 *     component: ({ data }) => <div>{data.user.name}</div>
 *   })
 */
export function defineRoute<TLoaderData = never, TActionData = never>(
  route: RouteDef<TLoaderData, TActionData>
): RouteDef<TLoaderData, TActionData> {
  return route
}

// Counter Logic
function counterLoader() {
  return Promise.resolve({ initial: 123 })
}

const counterActionInput = z.object({
  amount: z.coerce.number().int().min(1).max(100),
})

async function counterAction(ctx: any, formData: any) {
  // Server always passes FormData in our framework.
  // (Keeping it strict keeps things simple.)
  const fd = formData as FormData
  const input = parseFormData(fd, counterActionInput)

  console.log('Action run on server!', input.amount)
  // Simulate DB
  return { newCount: 123 + input.amount }
}

// Routes
export const routes: RouteDef[] = [
  {
    path: '/',
    loader: () => ({ now: Date.now() }),
    component: ({ data }) => (
      <div>
        <h1>Home</h1>
        <div>server now: {String(data.now)}</div>
        <a href="/counter">Counter</a>
      </div>
    ),
  },
  {
    path: '/counter',
    loader: counterLoader,
    action: counterAction,
    component: ({ data, csrfToken }) => (
      <div>
        <h1>Counter</h1>
        <div>loader initial: {String(data.initial)}</div>
        <a href="/">Home</a>

        {/* super simple: pure HTML form + PRG */}
        <form method="post" style={{ marginTop: 20 }}>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <input name="amount" type="number" defaultValue="1" />
          <button type="submit">Add (Server Action)</button>
        </form>
      </div>
    ),
  },
  {
    path: '/redir',
    loader: () => redirect('/counter'),
    component: () => <div>redirecting...</div>,
  },
  {
    path: '/gone',
    loader: () => notFound(),
    component: () => <div>gone</div>,
  },
  {
    path: '/action-redirect',
    loader: () => ({ ok: true }),
    action: () => redirect('/'),
    component: ({ csrfToken }) => (
      <div>
        <h1>Action redirect</h1>
        <form method="post">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <button type="submit">go</button>
        </form>
      </div>
    ),
  },
]

export const compiledRoutes: CompiledRouteDef[] = routes.map((r) => ({
  ...r,
  _compiled: compilePath(r.path),
}))
