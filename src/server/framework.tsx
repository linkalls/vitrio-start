import { renderToStringAsync } from '@potetotown/vitrio/server'
import { dehydrateLoaderCache, v, makeRouteCacheKey, type LoaderCtx } from '@potetotown/vitrio'
import type { ActionApi } from '@potetotown/vitrio'
import { matchCompiled } from './match'
import { config } from './config'
import type { CompiledRouteDef, PageMetadata } from '../route'
import { isRedirect, isNotFound, type RedirectStatus } from './response'

function newToken(): string {
  // Bun / Workers have crypto.randomUUID()
  // Fallback keeps it simple.
  const c = globalThis.crypto
  if (c && 'randomUUID' in c && typeof c.randomUUID === 'function') {
    return c.randomUUID()
  }
  return String(Math.random()).slice(2)
}

// --- Native cookie helpers ---

function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get('cookie') || ''
  const result: Record<string, string> = {}
  for (const part of header.split(';')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx < 0) continue
    const name = part.slice(0, eqIdx).trim()
    const value = part.slice(eqIdx + 1).trim()
    try {
      result[name] = decodeURIComponent(value)
    } catch {
      result[name] = value
    }
  }
  return result
}

interface CookieOptions {
  path?: string
  maxAge?: number
  httpOnly?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
}

function serializeCookie(name: string, value: string, opts: CookieOptions = {}): string {
  let s = `${name}=${encodeURIComponent(value)}`
  if (opts.path) s += `; Path=${opts.path}`
  if (opts.maxAge !== undefined) s += `; Max-Age=${opts.maxAge}`
  if (opts.httpOnly) s += `; HttpOnly`
  if (opts.sameSite) s += `; SameSite=${opts.sameSite}`
  return s
}

// --- Response builders ---

function applySecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Minimal CSP: only same-origin by default + inline scripts (for dehydration).
  // Tighten per-project as needed.
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  )
}

function makeRedirect(location: string, status: number, setCookies: string[]): Response {
  const headers = new Headers({ Location: location })
  applySecurityHeaders(headers)
  for (const cookie of setCookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status, headers })
}

function makeHtml(body: string, status: number, setCookies: string[]): Response {
  const headers = new Headers({ 'Content-Type': 'text/html; charset=UTF-8' })
  applySecurityHeaders(headers)
  for (const cookie of setCookies) headers.append('Set-Cookie', cookie)
  return new Response(body, { status, headers })
}

// --- CSRF helpers ---

function ensureCsrfCookie(cookies: Record<string, string>, setCookies: string[]): string {
  const existing = cookies['vitrio_csrf']
  if (existing) return existing
  const tok = newToken()
  // not httpOnly: needs to be embedded into SSR html/forms. still same-site.
  setCookies.push(serializeCookie('vitrio_csrf', tok, { path: '/', sameSite: 'Lax' }))
  return tok
}

function verifyCsrf(cookies: Record<string, string>, formData: FormData): boolean {
  const cookieTok = cookies['vitrio_csrf']
  const bodyTok = String(formData.get('_csrf') ?? '')
  return !!cookieTok && cookieTok === bodyTok
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export type FlashPayload = { ok: boolean; at: number; newCount?: number } | null

function readAndClearFlash(cookies: Record<string, string>, setCookies: string[]): FlashPayload {
  const raw = cookies['vitrio_flash']
  if (!raw) return null
  // clear (1-shot)
  setCookies.push(serializeCookie('vitrio_flash', '', { path: '/', maxAge: 0 }))
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setFlash(setCookies: string[], payload: Exclude<FlashPayload, null>): void {
  setCookies.push(
    serializeCookie('vitrio_flash', JSON.stringify(payload), {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }),
  )
}

type CacheEntry =
  | { status: 'pending'; promise: Promise<unknown> }
  | { status: 'fulfilled'; value: unknown }
  | { status: 'rejected'; error: unknown }

// --- Logging helpers ---

function logRequest(method: string, path: string, label: string, ms: number) {
  if (config.isProd) return
  console.log(`[vitrio] ${method} ${path} → ${label} (${ms}ms)`)
}

async function runMatchedAction(
  request: Request,
  cookies: Record<string, string>,
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

    const formData = await request.formData()
    if (!verifyCsrf(cookies, formData)) {
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
  request: Request,
  routes: CompiledRouteDef[],
  opts: { title: string; entrySrc: string; lang?: string },
): Promise<Response> {
  const t0 = Date.now()
  const method = request.method
  const url = new URL(request.url)
  const path = url.pathname

  // Accumulate Set-Cookie headers for the response
  const setCookies: string[] = []

  // Parse incoming cookies
  const cookies = parseCookies(request)

  // --- URL normalization: strip trailing slash (except root "/") ---
  if (path !== '/' && path.endsWith('/')) {
    const normalized = path.slice(0, -1) + url.search
    return makeRedirect(normalized, 301, setCookies)
  }

  // ensure CSRF cookie (GET/POST)
  const csrfToken = ensureCsrfCookie(cookies, setCookies)

  // POST -> Action -> Redirect (PRG)
  if (method === 'POST') {
    try {
      const r = await runMatchedAction(request, cookies, routes, path, url)

      logRequest(method, path, r.kind, Date.now() - t0)

      if (r.kind === 'redirect') {
        // explicit redirect from action (no flash)
        return makeRedirect(r.to, r.status, setCookies)
      }

      if (r.kind === 'notfound') {
        setFlash(setCookies, { ok: false, at: Date.now() })
        return makeRedirect(path, 303, setCookies)
      }

      if (r.kind === 'csrf-fail' || r.kind === 'no-match') {
        setFlash(setCookies, { ok: false, at: Date.now() })
        return makeRedirect(path, 303, setCookies)
      }

      // ok
      const out = r.out
      const newCount =
        out && typeof out === 'object' && typeof (out as any).newCount === 'number'
          ? Number((out as any).newCount)
          : undefined
      setFlash(setCookies, { ok: true, at: Date.now(), ...(newCount != null ? { newCount } : {}) })
      return makeRedirect(path, 303, setCookies)
    } catch (e) {
      console.error('Action failed', e)
      logRequest(method, path, 'error', Date.now() - t0)
      setFlash(setCookies, { ok: false, at: Date.now() })
      return makeRedirect(path, 303, setCookies)
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
        return makeRedirect(out.to, out.status ?? 302, setCookies)
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
        return makeRedirect(e.to, e.status ?? 302, setCookies)
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

    return makeHtml(
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
      setCookies,
    )
  }

  // --- SSR-first render ---
  // Default: SSR-only (no client router/hydration). Some routes can opt into
  // client-side JS ("use client"-style) via RouteDef.client.

  const bestMatch = routes
    .filter((r) => r.path !== '*' && !!matchCompiled(r._compiled, path))
    .sort((a, b) => b._compiled.segments.length - a._compiled.segments.length)[0]

  const enableClient = !!(bestMatch as any)?.client

  const flash = readAndClearFlash(cookies, setCookies)

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

  const dehydrated = dehydrateLoaderCache(cacheMap)

  // --- Per-page metadata (from RouteDef.metadata) ---
  const metadata: PageMetadata | undefined = bestMatch?.metadata
  const pageTitle = metadata?.title
    ? `${escapeHtml(metadata.title)} | ${escapeHtml(opts.title)}`
    : escapeHtml(opts.title)

  const metaHeadTags = [
    metadata?.description
      ? `<meta name="description" content="${escapeHtml(metadata.description)}" />`
      : '',
    metadata?.keywords
      ? `<meta name="keywords" content="${escapeHtml(metadata.keywords)}" />`
      : '',
    metadata?.openGraph?.title
      ? `<meta property="og:title" content="${escapeHtml(metadata.openGraph.title)}" />`
      : '',
    metadata?.openGraph?.description
      ? `<meta property="og:description" content="${escapeHtml(metadata.openGraph.description)}" />`
      : '',
    metadata?.openGraph?.image
      ? `<meta property="og:image" content="${escapeHtml(metadata.openGraph.image)}" />`
      : '',
    metadata?.openGraph?.type
      ? `<meta property="og:type" content="${escapeHtml(metadata.openGraph.type)}" />`
      : '',
    metadata?.canonical
      ? `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" />`
      : '',
    metadata?.noIndex ? '<meta name="robots" content="noindex, nofollow" />' : '',
  ]
    .filter(Boolean)
    .join('\n    ')

  return makeHtml(
    `<!doctype html>
<html lang="${escapeHtml(opts.lang ?? 'en')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pageTitle}</title>
    ${metaHeadTags}
    <link rel="stylesheet" href="/assets/tailwind.css" />
  </head>
  <body class="min-h-screen bg-zinc-950 text-zinc-100">
    ${flashBanner}
    <div id="app">${body}</div>
    <script>globalThis.__VITRIO_LOADER_CACHE__ = ${JSON.stringify(dehydrated)};</script>
    <script>globalThis.__VITRIO_FLASH__ = ${JSON.stringify(flash)};</script>
    ${enableClient ? `<script src="${opts.entrySrc}"></script>` : ''}
  </body>
</html>`,
    hasMatch ? 200 : 404,
    setCookies,
  )
}
