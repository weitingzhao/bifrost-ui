import type { ShellNavItem } from './types'

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
