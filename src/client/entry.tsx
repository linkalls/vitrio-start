import { render, Router, Routes, Route, Suspense, hydrateLoaderCache } from '@potetotown/vitrio'
import { routes } from '../routes'

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function isFlash(x: unknown): x is { ok: boolean; at: number } {
  if (typeof x !== 'object' || x === null) return false
  const ok = Reflect.get(x, 'ok')
  const at = Reflect.get(x, 'at')
  return typeof ok === 'boolean' && typeof at === 'number'
}

// Hydrate loader cache from server
if (isRecord(globalThis.__VITRIO_LOADER_CACHE__)) {
  hydrateLoaderCache(globalThis.__VITRIO_LOADER_CACHE__)
}

function FlashBanner() {
  const raw = globalThis.__VITRIO_FLASH__
  if (!isFlash(raw)) return null
  const flash = raw
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
                    ctx: import('@potetotown/vitrio').LoaderCtx & {
                      action: import('@potetotown/vitrio').ActionApi<FormData, unknown>
                    },
                  ) => r.component({ data, action: ctx.action, csrfToken: '' }),
                }),
              ),
              Route({ path: '*', children: () => <div>404</div> }),
            ],
          })
        }
      </Suspense>
    </Router>
  )
}

render(<App />, document.getElementById('app')!)
