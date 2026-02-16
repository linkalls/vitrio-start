export type RedirectResult = { _tag: 'redirect'; to: string; status?: number }
export type NotFoundResult = { _tag: 'notfound'; status?: number }

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

export function redirect(to: string, status: number = 303): RedirectResult {
  return { _tag: 'redirect', to, status }
}

export function notFound(status: number = 404): NotFoundResult {
  return { _tag: 'notfound', status }
}

export function isRedirect(x: any): x is RedirectResult {
  return !!x && typeof x === 'object' && x._tag === 'redirect'
}

export function isNotFound(x: any): x is NotFoundResult {
  return !!x && typeof x === 'object' && x._tag === 'notfound'
}
