import { Router, Routes, Route, Suspense, type VAtom } from '@potetotown/vitrio'
import { routes, type RouteDef } from '../routes'

const RoutesAny = Routes as any
const RouteAny = Route as any

export function App(props: {
  path: string
  locationAtom: VAtom<any>
  loaderCache: Map<string, any>
  csrfToken: string
}) {
  return (
    <Router locationAtom={props.locationAtom} loaderCache={props.loaderCache}>
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
                  r.component({ data, action: ctx.action, csrfToken: props.csrfToken })}
              </RouteAny>
            )),
            <RouteAny path="*">{() => <div>404</div>}</RouteAny>,
          ]}
        />
      </Suspense>
    </Router>
  )
}
