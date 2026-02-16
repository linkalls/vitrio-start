import type { LoaderCtx, ActionApi } from '@potetotown/vitrio'
import { z } from 'zod'
import { parseFormData } from './server/form'
import { compilePath, type CompiledPath } from './server/match'
import {
  redirect,
  notFound,
  type RedirectResult,
  type NotFoundResult,
  type ActionResult,
} from './server/response'

export type LoaderResult = RedirectResult | NotFoundResult | unknown

// Minimal route definition type (type-safe without `as`):
// - loaders/actions accept typed ctx/formData
// - data is `unknown` at the boundary; components validate via Zod
export interface RouteDef {
  path: string
  loader?: (ctx: LoaderCtx) => Promise<LoaderResult> | LoaderResult
  action?: (ctx: LoaderCtx, formData: FormData) => Promise<ActionResult> | ActionResult
  component: (props: {
    data: unknown
    action: ActionApi<FormData, unknown>
    csrfToken: string
  }) => unknown
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
export function defineRoute(route: RouteDef): RouteDef {
  return route
}

// Counter Logic
const counterLoaderData = z.object({ initial: z.number() })

function counterLoader() {
  return Promise.resolve({ initial: 123 })
}

const counterActionInput = z.object({
  amount: z.coerce.number().int().min(1).max(100),
})

async function counterAction(_ctx: LoaderCtx, formData: FormData) {
  const input = parseFormData(formData, counterActionInput)

  console.log('Action run on server!', input.amount)
  // Simulate DB
  return { newCount: 123 + input.amount }
}

// Routes
export const routes = [
  defineRoute({
    path: '/',
    loader: () => ({ now: Date.now() }),
    component: ({ data }) => {
      const homeData = z.object({ now: z.number() }).parse(data)
      return (
        <div>
          <h1>Home</h1>
          <div>server now: {String(homeData.now)}</div>
          <a href="/counter">Counter</a>
        </div>
      )
    },
  }),
  defineRoute({
    path: '/counter',
    loader: counterLoader,
    action: counterAction,
    component: ({ data, csrfToken }) => {
      const counterData = counterLoaderData.parse(data)
      return (
        <div>
          <h1>Counter</h1>
          <div>loader initial: {String(counterData.initial)}</div>
          <a href="/">Home</a>

          {/* super simple: pure HTML form + PRG */}
          <form method="post" style={{ marginTop: 20 }}>
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input name="amount" type="number" defaultValue="1" />
            <button type="submit">Add (Server Action)</button>
          </form>
        </div>
      )
    },
  }),
  defineRoute({
    path: '/redir',
    loader: () => redirect('/counter'),
    component: () => <div>redirecting...</div>,
  }),
  defineRoute({
    path: '/gone',
    loader: () => notFound(),
    component: () => <div>gone</div>,
  }),
  defineRoute({
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
  }),
]

export const compiledRoutes: CompiledRouteDef[] = routes.map((r) => ({
  ...r,
  _compiled: compilePath(r.path),
}))
