import type { Context } from 'hono'
import { renderToStringAsync } from '@potetotown/vitrio/server'
import { dehydrateLoaderCache, v, makeRouteCacheKey } from '@potetotown/vitrio'
import { matchCompiled } from './match'
import { getCookie, setCookie } from 'hono/cookie'
import { config } from './config'

function newToken(): string {
  // Bun has crypto.randomUUID()
  // Fallback keeps it simple.
  return (globalThis.crypto as any)?.randomUUID?.() ?? String(Math.random()).slice(2)
}

function ensureCsrfCookie(c: Context): string {
  const existing = getCookie(c, 'vitrio_csrf')
  if (existing) return existing
  const tok = newToken()
  // not httpOnly: needs to be embedded into SSR html/forms. still same-site.
  setCookie(c, 'vitrio_csrf', tok, { path: '/', sameSite: 'Lax' })
  return tok
}

function verifyCsrf(c: Context, formData: FormData): boolean {
  const cookieTok = getCookie(c, 'vitrio_csrf')
  const bodyTok = String(formData.get('_csrf') ?? '')
  return !!cookieTok && cookieTok === bodyTok
}
import type { CompiledRouteDef } from '../routes'
import { App } from './app'

export type FlashPayload = { ok: boolean; at: number } | null

function readAndClearFlash(c: Context): FlashPayload {
  const raw = getCookie(c, 'vitrio_flash')
  if (!raw) return null
  // clear (1-shot)
  setCookie(c, 'vitrio_flash', '', { path: '/', maxAge: 0 })
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setFlash(c: Context, ok: boolean) {
  setCookie(c, 'vitrio_flash', JSON.stringify({ ok, at: Date.now() }), {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  })
}

import { isRedirect, isNotFound } from './response'

// --- Security headers (minimal, applied to every document response) ---

function setSecurityHeaders(c: Context) {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Minimal CSP: only same-origin by default + inline scripts (for dehydration).
  // Tighten per-project as needed.
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  )
}

// --- Logging helpers ---

function logRequest(method: string, path: string, label: string, ms: number) {
  if (config.isProd) return
  console.log(`[vitrio] ${method} ${path} → ${label} (${ms}ms)`)
}

async function runMatchedAction(
  c: Context,
  routes: CompiledRouteDef[],
  path: string,
  url: URL,
): Promise<
  | { kind: 'no-match' }
  | { kind: 'csrf-fail' }
  | { kind: 'ok' }
  | { kind: 'redirect'; to: string; status: number }
  | { kind: 'notfound'; status: number }
> {
  // Find all matching routes with actions; prefer leaf-most action.
  const matched = routes
    .filter((r) => !!matchCompiled(r._compiled, path))
    .sort((a, b) => a._compiled.segments.length - b._compiled.segments.length)

  // Merge params parent -> child (same as client Route())
  let mergedParams: Record<string, string> = {}
  for (const r of matched) {
    const p = matchCompiled(r._compiled, path)
    if (p) mergedParams = { ...mergedParams, ...p }

    if (!r.action) continue

    const formData = await c.req.formData()
    if (!verifyCsrf(c, formData)) {
      return { kind: 'csrf-fail' }
    }

    const ctx = {
      params: mergedParams,
      search: url.searchParams,
      location: { path, query: url.search, hash: url.hash },
    }

    const out = await r.action(ctx as any, formData as any)

    if (isRedirect(out)) {
      return { kind: 'redirect', to: out.to, status: out.status ?? 303 }
    }
    if (isNotFound(out)) {
      return { kind: 'notfound', status: out.status ?? 404 }
    }

    return { kind: 'ok' }
  }

  return { kind: 'no-match' }
}

export async function handleDocumentRequest(
  c: Context,
  routes: CompiledRouteDef[],
  opts: { title: string; entrySrc: string },
) {
  const t0 = Date.now()
  const method = c.req.method
  const url = new URL(c.req.url)
  const path = url.pathname

  // --- URL normalization: strip trailing slash (except root "/") ---
  if (path !== '/' && path.endsWith('/')) {
    const normalized = path.slice(0, -1) + url.search
    return c.redirect(normalized, 301)
  }

  // Security headers on every document response
  setSecurityHeaders(c)

  // ensure CSRF cookie (GET/POST)
  const csrfToken = ensureCsrfCookie(c)

  // POST -> Action -> Redirect (PRG)
  if (method === 'POST') {
    try {
      const r = await runMatchedAction(c, routes, path, url)

      logRequest(method, path, r.kind, Date.now() - t0)

      if (r.kind === 'redirect') {
        // explicit redirect from action (no flash)
        return c.redirect(r.to, r.status as any)
      }

      if (r.kind === 'notfound') {
        setFlash(c, false)
        return c.redirect(path, 303)
      }

      if (r.kind === 'csrf-fail' || r.kind === 'no-match') {
        setFlash(c, false)
        return c.redirect(path, 303)
      }

      // ok
      setFlash(c, true)
      return c.redirect(path, 303)
    } catch (e) {
      console.error('Action failed', e)
      logRequest(method, path, 'error', Date.now() - t0)
      setFlash(c, false)
      return c.redirect(path, 303)
    }
  }

  // GET -> SSR
  const locAtom = v({ path, query: url.search, hash: url.hash })
  const cacheMap = new Map<string, any>()

  // Find all matching routes (excluding catch-all). This enables simple "layout"
  // style prefix routes like `/parent/*` + a leaf `/parent/child`.
  const matchedRoutes = routes
    .filter((r) => r.path !== '*' && !!matchCompiled(r._compiled, path))
    // parent first (shorter patterns first)
    .sort((a, b) => a._compiled.segments.length - b._compiled.segments.length)

  // Best-effort status code: 404 when no route matches.
  // (We still render the app; App includes a "*" route for the UI.)
  let hasMatch = matchedRoutes.length > 0
  let loaderError: unknown = null

  // Allow loader to return redirect/notFound (no magic).
  // Also: prime Vitrio loader cache so Route() does not execute loader twice in SSR.
  let mergedParams: Record<string, string> = {}
  for (const r of matchedRoutes) {
    if (!r.loader) continue

    const params = matchCompiled(r._compiled, path) || {}
    mergedParams = { ...mergedParams, ...params }

    const ctx = {
      params: mergedParams,
      search: url.searchParams,
      location: { path, query: url.search, hash: url.hash },
    }

    try {
      const out = await r.loader(ctx as any)
      if (isRedirect(out)) {
        logRequest(method, path, 'loader-redirect', Date.now() - t0)
        return c.redirect(out.to, (out.status ?? 302) as any)
      }
      if (isNotFound(out)) {
        hasMatch = false
        break
      }

      // Prime cache entry (routeId == path by default)
      const key = makeRouteCacheKey(r.path, ctx as any)
      cacheMap.set(key, { status: 'fulfilled', value: out })
    } catch (e: any) {
      if (isRedirect(e)) {
        logRequest(method, path, 'loader-redirect', Date.now() - t0)
        return c.redirect(e.to, (e.status ?? 302) as any)
      }
      if (isNotFound(e)) {
        hasMatch = false
        break
      }
      // Loader threw an unexpected error → 500
      console.error('Loader error', e)
      loaderError = e
      break
    }
  }

  // If a loader threw, render a 500 error page
  if (loaderError) {
    logRequest(method, path, '500', Date.now() - t0)
    const errorMessage = config.isProd
      ? 'Internal Server Error'
      : String(loaderError instanceof Error ? loaderError.stack || loaderError.message : loaderError)

    return c.html(
      `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>500 - ${opts.title}</title>
  </head>
  <body>
    <h1>500 Internal Server Error</h1>
    ${config.isProd ? '' : `<pre>${errorMessage}</pre>`}
  </body>
</html>`,
      500,
    )
  }

  const body = await renderToStringAsync(
    <App path={path} locationAtom={locAtom} loaderCache={cacheMap} csrfToken={csrfToken} />,
  )

  const cache = dehydrateLoaderCache(cacheMap as any)
  const flash = readAndClearFlash(c)

  logRequest(method, path, hasMatch ? '200' : '404', Date.now() - t0)

  return c.html(
    `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${opts.title}</title>
  </head>
  <body>
    <div id="app">${body}</div>
    <script>globalThis.__VITRIO_LOADER_CACHE__ = ${JSON.stringify(cache)};</script>
    <script>globalThis.__VITRIO_FLASH__ = ${JSON.stringify(flash)};</script>
    <script type="module" src="${opts.entrySrc}"></script>
  </body>
</html>`,
    hasMatch ? 200 : 404,
  )
}
