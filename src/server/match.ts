export type CompiledPath = {
  pattern: string
  segments: string[]
  isPrefix: boolean
}

export function compilePath(pattern: string): CompiledPath {
  const isPrefix = pattern.endsWith('*')
  const normalized = isPrefix ? pattern.slice(0, -1) : pattern
  const segments = normalized.split('/').filter(Boolean)
  return { pattern, segments, isPrefix }
}

export function matchCompiled(
  compiled: CompiledPath,
  path: string,
): Record<string, string> | null {
  if (compiled.pattern === '*') return {}

  const a = compiled.segments
  const b = path.split('/').filter(Boolean)

  if (!compiled.isPrefix && a.length !== b.length) return null
  if (compiled.isPrefix && b.length < a.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < a.length; i++) {
    const seg = a[i]
    const cur = b[i]
    if (seg.startsWith(':')) {
      params[seg.slice(1)] = decodeURIComponent(cur)
      continue
    }
    if (seg !== cur) return null
  }
  return params
}
