import type { RouteLoader, RouteAction, ActionApi } from '@potetotown/vitrio'
import { z } from 'zod'
import { parseFormData } from './server/form'
import { compilePath, type CompiledPath } from './server/match'

// Minimal route definition type
export interface RouteDef {
  path: string
  loader?: RouteLoader<any>
  action?: RouteAction<any, any>
  component: (props: {
    data: any
    action: ActionApi<any>
    csrfToken: string
  }) => any
}

export type CompiledRouteDef = RouteDef & { _compiled: CompiledPath }

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
]

export const compiledRoutes: CompiledRouteDef[] = routes.map((r) => ({
  ...r,
  _compiled: compilePath(r.path),
}))
