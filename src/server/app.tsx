import { Router, Routes, Route, A, Suspense, type VAtom, v, derive, get } from '@potetotown/vitrio'

const RoutesAny = Routes as any
const RouteAny = Route as any

// Demo loader
function counterLoader() {
  // pretend async
  return Promise.resolve({ initial: 123 })
}

export function App(props: {
  path: string
  locationAtom: VAtom<any>
  loaderCache: Map<string, any>
}) {
  return (
    <Router locationAtom={props.locationAtom} loaderCache={props.loaderCache}>
      <Suspense fallback={<div>loading...</div>}>
        <RoutesAny>
          <RouteAny path="/" loader={() => ({ now: Date.now() })}>
            {(data: any) => (
              <div>
                <h1>Home</h1>
                <div>server now: {String(data.now)}</div>
                <A href="/counter">Counter</A>
              </div>
            )}
          </RouteAny>

          <RouteAny path="/counter" loader={async () => await counterLoader()}>
            {(data: any) => (
              <div>
                <h1>Counter</h1>
                <div>loader initial: {String(data.initial)}</div>
                <A href="/">Home</A>
              </div>
            )}
          </RouteAny>

          <RouteAny path="*">{() => <div>404</div>}</RouteAny>
        </RoutesAny>
      </Suspense>
    </Router>
  )
}
