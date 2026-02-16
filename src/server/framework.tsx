import type { Context } from 'hono'
import { renderToStringAsync } from '@potetotown/vitrio/server'
import { dehydrateLoaderCache, matchPath, v } from '@potetotown/vitrio'
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
import type { RouteDef } from '../routes'
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

async function runMatchedAction(c: Context, routes: RouteDef[], path: string, url: URL) {
  for (const r of routes) {
    const params = matchPath(r.path, path)
    if (!params || !r.action) continue

    const formData = await c.req.formData()
    if (!verifyCsrf(c, formData)) {
      return false
    }

    const ctx = {
      params,
      search: url.searchParams,
      location: { path, query: url.search, hash: url.hash },
    }

    await r.action(ctx as any, formData as any)
    return true
  }

  return false
}

export async function handleDocumentRequest(
  c: Context,
  routes: RouteDef[],
  opts: { title: string; entrySrc: string },
) {
  const method = c.req.method
  const url = new URL(c.req.url)
  const path = url.pathname

  // ensure CSRF cookie (GET/POST)
  const csrfToken = ensureCsrfCookie(c)

  // POST -> Action -> 303 Redirect (PRG)
  if (method === 'POST') {
    try {
      const ok = await runMatchedAction(c, routes, path, url)
      setFlash(c, ok)
    } catch (e) {
      console.error('Action failed', e)
      setFlash(c, false)
    }
    return c.redirect(path, 303)
  }

  // GET -> SSR
  const locAtom = v({ path, query: url.search, hash: url.hash })
  const cacheMap = new Map<string, any>()

  const body = await renderToStringAsync(
    <App path={path} locationAtom={locAtom} loaderCache={cacheMap} csrfToken={csrfToken} />,
  )

  const cache = dehydrateLoaderCache(cacheMap as any)
  const flash = readAndClearFlash(c)

  return c.html(`<!doctype html>
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
</html>`)
}
