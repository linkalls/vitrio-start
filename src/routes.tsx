import { navigate } from '@potetotown/vitrio'
import type { RouteLoader, RouteAction, ActionApi } from '@potetotown/vitrio'

// Minimal route definition type
export interface RouteDef {
  path: string
  loader?: RouteLoader<any>
  action?: RouteAction<any, any>
  component: (props: { data: any; action: ActionApi<any> }) => any
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
    component: ({ data }) => (
      <div>
        <h1>Counter</h1>
        <div>loader initial: {String(data.initial)}</div>
        <a href="/">Home</a>

        {/* Progressive enhancement:
            - no JS: normal POST -> 303 -> GET
            - with JS: fetch POST, then navigate() to Location
        */}
        <form
          method="post"
          style={{ marginTop: 20 }}
          onSubmit={async (e: any) => {
            if (typeof window === 'undefined') return
            e.preventDefault()

            const form = e.currentTarget as HTMLFormElement
            const fd = new FormData(form)

            const res = await fetch(window.location.pathname, {
              method: 'POST',
              body: fd,
              redirect: 'manual',
            })

            if (res.status >= 300 && res.status < 400) {
              const to = res.headers.get('Location') || '/'
              // Flash is httpOnly cookie -> we need a real GET request so server can
              // embed __VITRIO_FLASH__ and clear it. So do a hard navigation.
              window.location.assign(to)
              return
            }

            // Fallback: if redirect is auto-followed, move to final URL
            if ((res as any).redirected && (res as any).url) {
              window.location.assign((res as any).url)
            }
          }}
        >
          <input name="amount" type="number" defaultValue="1" />
          <button type="submit">Add (Server Action)</button>
        </form>
      </div>
    ),
  },
]
