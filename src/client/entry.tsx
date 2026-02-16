import { render, Router, Routes, Route, Suspense, hydrateLoaderCache } from '@potetotown/vitrio'
import { routes, type RouteDef } from '../routes'

const RoutesAny = Routes as any
const RouteAny = Route as any

// Hydrate loader cache from server
hydrateLoaderCache((globalThis as any).__VITRIO_LOADER_CACHE__)

function App() {
  return (
    <Router>
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
                  r.component({ data, action: ctx.action })}
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
