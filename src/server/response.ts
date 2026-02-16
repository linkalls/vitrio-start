export type RedirectStatus = 301 | 302 | 303 | 307 | 308

export type RedirectResult = { _tag: 'redirect'; to: string; status?: RedirectStatus }
export type NotFoundResult = { _tag: 'notfound'; status?: 404 }

/**
 * Action return type guide:
 *
 *   redirect(to)   — PRG redirect (303 by default). No flash is set automatically;
 *                     the action handler sets flash before returning if needed.
 *   notFound()     — Signals "not found". The framework sets flash(ok=false) and
 *                     redirects back with 303.
 *   { …plain obj } — "ok" result. The framework sets flash(ok=true) and redirects
 *                     back with 303 (standard PRG).
 *
 * All three are valid return values from an action function.
 */
export type ActionResult<T = unknown> = RedirectResult | NotFoundResult | T

export function redirect(to: string, status: RedirectStatus = 303): RedirectResult {
  return { _tag: 'redirect', to, status }
}

export function notFound(): NotFoundResult {
  return { _tag: 'notfound', status: 404 }
}

function hasTag(x: unknown): x is { _tag: unknown } {
  return typeof x === 'object' && x !== null && '_tag' in x
}

export function isRedirect(x: unknown): x is RedirectResult {
  return hasTag(x) && x._tag === 'redirect'
}

export function isNotFound(x: unknown): x is NotFoundResult {
  return hasTag(x) && x._tag === 'notfound'
}
