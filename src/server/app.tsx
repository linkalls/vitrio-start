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
            <RouteAny path="*">
              {() => (
                <div style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  maxWidth: '800px',
                  margin: '80px auto',
                  padding: '0 20px',
                  color: '#333',
                  lineHeight: 1.6
                }}>
                  <h1 style={{
                    color: '#f57c00',
                    borderBottom: '2px solid #f57c00',
                    paddingBottom: '10px'
                  }}>404 Not Found</h1>
                  <p style={{ color: '#999', fontSize: '14px' }}>
                    The page you are looking for does not exist.
                  </p>
                  <a href="/" style={{ color: '#1976d2', textDecoration: 'none' }}>
                    ← Back to Home
                  </a>
                </div>
              )}
            </RouteAny>,
          ]}
        />
      </Suspense>
    </Router>
  )
}
