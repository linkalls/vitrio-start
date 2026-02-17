import type { Context } from 'hono'
import { renderToStringAsync } from '@potetotown/vitrio/server'
import { dehydrateLoaderCache, v, makeRouteCacheKey, type LoaderCtx } from '@potetotown/vitrio'
import { matchCompiled } from './match'
import { getCookie, setCookie } from 'hono/cookie'
import { config } from './config'

function newToken(): string {
  // Bun has crypto.randomUUID()
  // Fallback keeps it simple.
  const c = globalThis.crypto
  if (c && 'randomUUID' in c && typeof c.randomUUID === 'function') {
    return c.randomUUID()
  }
  return String(Math.random()).slice(2)
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
import type { ActionApi } from '@potetotown/vitrio'

export type FlashPayload = { ok: boolean; at: number; newCount?: number } | null

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

function setFlash(c: Context, payload: Exclude<FlashPayload, null>) {
  setCookie(c, 'vitrio_flash', JSON.stringify(payload), {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  })
}

import { isRedirect, isNotFound, type RedirectStatus } from './response'

type CacheEntry =
  | { status: 'pending'; promise: Promise<unknown> }
  | { status: 'fulfilled'; value: unknown }
  | { status: 'rejected'; error: unknown }

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
  | { kind: 'ok'; out: unknown }
  | { kind: 'redirect'; to: string; status: RedirectStatus }
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

    const ctx: LoaderCtx = {
      params: mergedParams,
      search: url.searchParams,
      location: { path, query: url.search, hash: url.hash },
    }

    const out = await r.action(ctx, formData)

    if (isRedirect(out)) {
      return { kind: 'redirect', to: out.to, status: out.status ?? 303 }
    }
    if (isNotFound(out)) {
      return { kind: 'notfound', status: out.status ?? 404 }
    }

    return { kind: 'ok', out }
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
        return c.redirect(r.to, r.status)
      }

      if (r.kind === 'notfound') {
        setFlash(c, { ok: false, at: Date.now() })
        return c.redirect(path, 303)
      }

      if (r.kind === 'csrf-fail' || r.kind === 'no-match') {
        setFlash(c, { ok: false, at: Date.now() })
        return c.redirect(path, 303)
      }

      // ok
      const out = r.out
      const newCount =
        out && typeof out === 'object' && typeof (out as any).newCount === 'number'
          ? Number((out as any).newCount)
          : undefined
      setFlash(c, { ok: true, at: Date.now(), ...(newCount != null ? { newCount } : {}) })
      return c.redirect(path, 303)
    } catch (e) {
      console.error('Action failed', e)
      logRequest(method, path, 'error', Date.now() - t0)
      setFlash(c, { ok: false, at: Date.now() })
      return c.redirect(path, 303)
    }
  }

  // GET -> SSR
  const locAtom = v({ path, query: url.search, hash: url.hash })
  const cacheMap = new Map<string, CacheEntry>()

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

    const ctx: LoaderCtx = {
      params: mergedParams,
      search: url.searchParams,
      location: { path, query: url.search, hash: url.hash },
    }

    try {
      const out = await r.loader(ctx)
      if (isRedirect(out)) {
        logRequest(method, path, 'loader-redirect', Date.now() - t0)
        return c.redirect(out.to, out.status ?? 302)
      }
      if (isNotFound(out)) {
        hasMatch = false
        break
      }

      // Prime cache entry (routeId == path by default)
      const key = makeRouteCacheKey(r.path, ctx)
      cacheMap.set(key, { status: 'fulfilled', value: out })
    } catch (e: unknown) {
      if (isRedirect(e)) {
        logRequest(method, path, 'loader-redirect', Date.now() - t0)
        return c.redirect(e.to, e.status ?? 302)
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
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        max-width: 800px;
        margin: 80px auto;
        padding: 0 20px;
        color: #333;
        line-height: 1.6;
      }
      h1 {
        color: #d32f2f;
        border-bottom: 2px solid #d32f2f;
        padding-bottom: 10px;
      }
      pre {
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 15px;
        overflow-x: auto;
        font-size: 14px;
      }
      .error-code {
        color: #999;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <h1>500 Internal Server Error</h1>
    <p class="error-code">An error occurred while processing your request.</p>
    ${config.isProd ? '' : `<pre>${errorMessage}</pre>`}
  </body>
</html>`,
      500,
    )
  }

  // --- SSR-first render ---
  // Default: SSR-only (no client router/hydration). Some routes can opt into
  // client-side JS ("use client"-style) via RouteDef.client.

  const bestMatch = routes
    .filter((r) => r.path !== '*' && !!matchCompiled(r._compiled, path))
    .sort((a, b) => b._compiled.segments.length - a._compiled.segments.length)[0]

  const enableClient = !!(bestMatch as any)?.client

  const flash = readAndClearFlash(c)

  // Minimal ActionApi stub (components may accept it even if unused in SSR)
  const actionStub: ActionApi<FormData, unknown> = {
    run: async () => {
      throw new Error('Actions are not available in SSR-only mode. Submit the HTML form (POST) instead.')
    },
    pending: () => false,
    error: () => undefined,
    data: () => undefined,
  }

  // Recompute ctx + loader data for the best match
  let ssrVNode: any = null
  if (bestMatch) {
    const params = matchCompiled(bestMatch._compiled, path) || {}
    const ctx: LoaderCtx = {
      params,
      search: url.searchParams,
      location: { path, query: url.search, hash: url.hash },
    }
    const key = makeRouteCacheKey(bestMatch.path, ctx)
    const entry = cacheMap.get(key)
    const data = entry && 'status' in entry && entry.status === 'fulfilled' ? entry.value : undefined
    ssrVNode = bestMatch.component({ data, action: actionStub, csrfToken })
  } else {
    hasMatch = false
  }

  const body = await renderToStringAsync(ssrVNode as any)

  logRequest(method, path, hasMatch ? '200' : '404', Date.now() - t0)

  const flashBanner =
    flash && flash.ok
      ? `<div class="mx-auto max-w-3xl px-6 pt-6">
           <div class="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-emerald-100">
             <div class="text-sm font-semibold">Saved</div>
             <div class="mt-1 text-sm text-emerald-200">
               ${flash.newCount != null ? `New count: <span class="font-mono">${flash.newCount}</span>` : `Action completed successfully.`}
             </div>
           </div>
         </div>`
      : flash && !flash.ok
        ? `<div class="mx-auto max-w-3xl px-6 pt-6">
             <div class="rounded-2xl border border-rose-800/60 bg-rose-950/40 p-4 text-rose-100">
               <div class="text-sm font-semibold">Failed</div>
               <div class="mt-1 text-sm text-rose-200">Something went wrong (CSRF / no matching action).</div>
             </div>
           </div>`
        : ''

  return c.html(
    `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${opts.title}</title>
    <link rel="stylesheet" href="/assets/tailwind.css" />
  </head>
  <body class="min-h-screen bg-zinc-950 text-zinc-100">
    ${flashBanner}
    <div id="app">${body}</div>
    <script>globalThis.__VITRIO_FLASH__ = ${JSON.stringify(flash)};</script>
    ${enableClient ? `<script src="${opts.entrySrc}"></script>` : ''}
  </body>
</html>`,
    hasMatch ? 200 : 404,
  )
}
