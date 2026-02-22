import type { VNode } from '@potetotown/vitrio/jsx-runtime'
import { IslandMarker } from './islands'

export type AnyProps = Record<string, unknown>
export type AnyComponent<P = any> = (props: P) => VNode

function defaultIslandName(fn: Function): string {
  // NOTE: function.name can be mangled/minified in production builds.
  // Prefer explicit name via options.
  return fn.name || 'Island'
}

/**
 * Call-site style: island(Counter, { initial: 1 })
 *
 * - SSR renders the fallback children (so no-JS still works)
 * - Adds a marker so client can mount/hydrate the same component
 */
export function island<P extends AnyProps>(
  Component: AnyComponent<P>,
  props: P,
  options?: { name?: string },
): VNode {
  const name = options?.name ?? defaultIslandName(Component)

  return (
    <IslandMarker name={name} props={props}>
      {Component(props)}
    </IslandMarker>
  )
}

/**
 * Declaration style: const Counter = client(Counter)
 */
export function client<P extends AnyProps>(
  Component: AnyComponent<P>,
  options?: { name?: string },
): (props: P) => VNode {
  const name = options?.name ?? defaultIslandName(Component)
  return (props: P) => island(Component, props, { name })
}
