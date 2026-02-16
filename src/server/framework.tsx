import type { Context } from 'hono'
import { renderToStringAsync } from '@potetotown/vitrio/server'
import { dehydrateLoaderCache, v, makeRouteCacheKey } from '@potetotown/vitrio'
import { matchCompiled } from './match'
import { getCookie, setCookie } from 'hono/cookie'

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
  for (const r of routes) {
    const params = matchCompiled(r._compiled, path)
    if (!params || !r.action) continue

    const formData = await c.req.formData()
    if (!verifyCsrf(c, formData)) {
      return { kind: 'csrf-fail' }
    }

    const ctx = {
      params,
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
  const method = c.req.method
  const url = new URL(c.req.url)
  const path = url.pathname

  // ensure CSRF cookie (GET/POST)
  const csrfToken = ensureCsrfCookie(c)

  // POST -> Action -> Redirect (PRG)
  if (method === 'POST') {
    try {
      const r = await runMatchedAction(c, routes, path, url)

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
      setFlash(c, false)
      return c.redirect(path, 303)
    }
  }

  // GET -> SSR
  const locAtom = v({ path, query: url.search, hash: url.hash })
  const cacheMap = new Map<string, any>()

  // Find first matching route (excluding catch-all).
  const matched = routes.find(
    (r) => r.path !== '*' && !!matchCompiled(r._compiled, path),
  )

  // Best-effort status code: 404 when no route matches.
  // (We still render the app; App includes a "*" route for the UI.)
  let hasMatch = !!matched

  // Allow loader to return redirect/notFound (no magic).
  // Also: prime Vitrio loader cache so Route() does not execute loader twice in SSR.
  if (matched?.loader) {
    const params = matchCompiled(matched._compiled, path) || {}
    const ctx = {
      params,
      search: url.searchParams,
      location: { path, query: url.search, hash: url.hash },
    }

    try {
      const out = await matched.loader(ctx as any)
      if (isRedirect(out)) {
        return c.redirect(out.to, (out.status ?? 302) as any)
      }
      if (isNotFound(out)) {
        hasMatch = false
      } else {
        // Prime cache entry (routeId == path by default)
        const key = makeRouteCacheKey(matched.path, ctx as any)
        cacheMap.set(key, { status: 'fulfilled', value: out })
      }
    } catch (e: any) {
      if (isRedirect(e)) {
        return c.redirect(e.to, (e.status ?? 302) as any)
      }
      if (isNotFound(e)) {
        hasMatch = false
      } else {
        throw e
      }
    }
  }

  const body = await renderToStringAsync(
    <App path={path} locationAtom={locAtom} loaderCache={cacheMap} csrfToken={csrfToken} />,
  )

  const cache = dehydrateLoaderCache(cacheMap as any)
  const flash = readAndClearFlash(c)

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
