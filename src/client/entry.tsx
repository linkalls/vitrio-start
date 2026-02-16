import { render, Router, Routes, Route, Suspense, hydrateLoaderCache } from '@potetotown/vitrio'
import { routes, type RouteDef } from '../routes'

const RoutesAny = Routes as any
const RouteAny = Route as any

// Hydrate loader cache from server
hydrateLoaderCache((globalThis as any).__VITRIO_LOADER_CACHE__)

function FlashBanner() {
  const flash = (globalThis as any).__VITRIO_FLASH__ as null | { ok: boolean; at: number }
  if (!flash) return null
  return (
    <div
      style={
        'padding:10px 12px;border-radius:8px;margin:12px 0;' +
        (flash.ok
          ? 'background:#e9f7ef;border:1px solid #7bd89f;color:#135f2d;'
          : 'background:#fdecea;border:1px solid #f19999;color:#7a1111;')
      }
    >
      {flash.ok ? 'Saved!' : 'Failed...'}
    </div>
  )
}

function App() {
  return (
    <Router>
      <FlashBanner />
      <Suspense fallback={<div>loading...</div>}>
        <RoutesAny
          children={[
            ...routes.map((r: RouteDef) => (
              <RouteAny
                key={r.path}
                path={r.path}
                loader={r.loader}
                action={r.action}
              >
                {(data: any, ctx: any) =>
                  r.component({ data, action: ctx.action, csrfToken: '' })}
              </RouteAny>
            )),
            <RouteAny path="*">{() => <div>404</div>}</RouteAny>,
          ]}
        />
      </Suspense>
    </Router>
  )
}

render(<App />, document.getElementById('app')!)
