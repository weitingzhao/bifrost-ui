import type { ReactNode } from 'react'
import type { ShellNavItem } from './types'

/** Slot content for Seat / Partner / navPrefix — static node or collapsed-aware render fn. */
export type ShellNavSlotContent = ReactNode | ((collapsed: boolean) => ReactNode)

export function resolveShellNavSlot(
  slot: ShellNavSlotContent | undefined,
  collapsed: boolean,
): ReactNode | null {
  if (slot == null) return null
  return typeof slot === 'function' ? slot(collapsed) : slot
}

export function defaultMatchActive(item: ShellNavItem, activeId: string): boolean {
  if (item.id === activeId) return true
  return item.children?.some((child) => defaultMatchActive(child, activeId)) ?? false
}

/** Route-prefix active check for react-router consumers (Trade). */
export function shellNavMatchByPathPrefix(item: ShellNavItem, pathname: string): boolean {
  const path = item.to ?? item.href ?? item.id
  if (pathname.startsWith(path)) return true
  return item.children?.some((child) => shellNavMatchByPathPrefix(child, pathname)) ?? false
}

/**
 * A flat list with its collapsed captions folded away.
 *
 * A caption (§5a.7) names the siblings that follow it rather than owning
 * them, so folding is a fact about the *list*, not about the item: everything
 * after a collapsed caption is hidden until the next caption, and the caption
 * itself always stays — it is the way back.
 *
 * Items before the first caption belong to no caption and are never hidden.
 */
export function visibleUnderCaptions(
  items: readonly ShellNavItem[],
  collapsed: ReadonlySet<string>,
): ShellNavItem[] {
  const out: ShellNavItem[] = []
  let hiding = false
  for (const item of items) {
    if (item.kind === 'caption') {
      hiding = collapsed.has(item.id)
      out.push(item)
      continue
    }
    if (!hiding) out.push(item)
  }
  return out
}

/** The captions in a list, in order. */
export function captionsOf(items: readonly ShellNavItem[]): ShellNavItem[] {
  return items.filter((i) => i.kind === 'caption')
}
