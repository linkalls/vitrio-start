import type { RouteLoader, RouteAction, ActionApi } from '@potetotown/vitrio'

// Minimal route definition type
export interface RouteDef {
  path: string
  loader?: RouteLoader<any>
  action?: RouteAction<any, any>
  component: (props: { data: any; action: ActionApi<any>; csrfToken: string }) => any
}

// Counter Logic
function counterLoader() {
  return Promise.resolve({ initial: 123 })
}

async function counterAction(ctx: any, formData: any) {
  // Hono/Bun環境によって FormData じゃなく plain object が来ることがあるので吸収
  const raw = typeof formData?.get === 'function'
    ? formData.get('amount')
    : (formData?.amount ?? 1)
  const amount = Number(raw || 1)
  console.log('Action run on server!', amount)
  // Simulate DB
  return { newCount: 123 + amount }
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
