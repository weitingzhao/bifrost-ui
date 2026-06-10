import type { ReactNode } from 'react'

export type ShellNavItem = {
  id: string
  label: string
  /** In-app hash/path or external URL */
  href: string
  external?: boolean
  active?: boolean
  onClick?: () => void
  /** Single char shown when sidebar is collapsed (defaults to first letter of label). */
  shortLabel?: string
}

export type ShellNavGroup = {
  label: string
  items: ShellNavItem[]
}

export type PeerAppLink = {
  label: string
  href: string
  description?: string
}

export type MonitoringShellProps = {
  productName: string
  productTagline?: string
  /** Short badge e.g. "Platform" | "Trade" */
  productBadge?: string
  navGroups?: ShellNavGroup[]
  peerApp?: PeerAppLink
  headerActions?: ReactNode
  sidebarFooter?: ReactNode
  children: ReactNode
  /** Persisted open state on first load (default true). */
  sidebarDefaultOpen?: boolean
}
