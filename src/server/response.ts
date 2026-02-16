export type RedirectResult = { _tag: 'redirect'; to: string; status?: number }
export type NotFoundResult = { _tag: 'notfound'; status?: number }

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
