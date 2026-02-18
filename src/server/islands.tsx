import type { VNode } from '@potetotown/vitrio'

export function IslandMarker(p: {
  name: string
  props?: unknown
  children?: unknown
}): VNode {
  return (
    <div
      data-island={p.name}
      data-props={JSON.stringify(p.props ?? {})}
    >
      {p.children}
    </div>
  )
}
