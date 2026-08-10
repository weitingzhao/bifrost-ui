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
