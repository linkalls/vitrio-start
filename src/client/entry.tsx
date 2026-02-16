import { render, Router, Routes, Route, A, Suspense, v, get, set, derive, hydrateLoaderCache } from '@potetotown/vitrio'

// SSR loader cache hydration
hydrateLoaderCache((globalThis as any).__VITRIO_LOADER_CACHE__)

const RoutesAny = Routes as any
const RouteAny = Route as any

const count = v(0)
const doubled = derive((g) => g(count) * 2)

function App() {
  return (
    <Router>
      <Suspense fallback={<div>loading...</div>}>
        <nav style={{ display: 'flex', gap: 12 }}>
          <A href="/">Home</A>
          <A href="/counter">Counter</A>
        </nav>
        <RoutesAny>
          <RouteAny path="/">{() => <div>Home</div>}</RouteAny>
          <RouteAny path="/counter">{() => (
            <div>
              <h1>Counter</h1>
              <button onClick={() => set(count, (c) => c - 1)}>-</button>
              <span style={{ padding: '0 8px' }}>{() => String(get(count))}</span>
              <button onClick={() => set(count, (c) => c + 1)}>+</button>
              <div>doubled: {() => String(get(doubled))}</div>
            </div>
          )}</RouteAny>
          <RouteAny path="*">{() => <div>404</div>}</RouteAny>
        </RoutesAny>
      </Suspense>
    </Router>
  )
}

render(<App />, document.getElementById('app')!)
