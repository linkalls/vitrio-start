import {
  Router,
  Routes,
  Route,
  Suspense,
  type LoaderCtx,
  type VAtom,
  type ActionApi,
} from '@potetotown/vitrio'
import { routes } from '../routes'

export function App(props: {
  path: string
  locationAtom: VAtom<LoaderCtx['location']>
  loaderCache: Map<string, unknown>
  csrfToken: string
}) {
  return (
    <Router locationAtom={props.locationAtom} loaderCache={props.loaderCache}>
      <Suspense fallback={<div>loading...</div>}>
        {
          Routes({
            children: [
              ...routes.map((r) =>
                Route({
                  path: r.path,
                  loader: r.loader,
                  action: r.action,
                  children: (
                    data: unknown,
                    ctx: LoaderCtx & { action: ActionApi<FormData, unknown> },
                  ) => r.component({
                    data,
                    action: ctx.action,
                    csrfToken: props.csrfToken,
                  }),
                }),
              ),
              Route({
                path: '*',
                children: () => (
                  <div
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      maxWidth: '800px',
                      margin: '80px auto',
                      padding: '0 20px',
                      color: '#333',
                      lineHeight: 1.6,
                    }}
                  >
                    <h1
                      style={{
                        color: '#f57c00',
                        borderBottom: '2px solid #f57c00',
                        paddingBottom: '10px',
                      }}
                    >
                      404 Not Found
                    </h1>
                    <p style={{ color: '#999', fontSize: '14px' }}>
                      The page you are looking for does not exist.
                    </p>
                    <a
                      href="/"
                      style={{ color: '#1976d2', textDecoration: 'none' }}
                    >
                      ← Back to Home
                    </a>
                  </div>
                ),
              }),
            ],
          })
        }
      </Suspense>
    </Router>
  )
}
