import { render, type VNode } from '@potetotown/vitrio'

export type IslandComponent<P = any> = (props: P) => VNode
export type IslandRegistry = Record<string, IslandComponent<any>>

function parseProps(raw: string | null): any {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/**
 * Islands "hydration" for vitrio-start.
 *
 * Current behavior: mount (replace content) into each [data-island] node.
 * True DOM-preserving hydration is a future enhancement.
 */
export function hydrateIslands(registry: IslandRegistry, root: ParentNode = document): void {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-island]'))
  for (const el of nodes) {
    if (el.dataset.hydrated === '1') continue

    const name = el.dataset.island
    if (!name) continue

    const Comp = registry[name]
    if (!Comp) continue

    const props = parseProps(el.getAttribute('data-props'))
    el.dataset.hydrated = '1'
    render(() => Comp(props), el)
  }
}
