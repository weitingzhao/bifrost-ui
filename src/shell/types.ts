import type { ComponentType } from 'react'

/** Any component that accepts at least `className` — matches LucideIcon and similar. */
export type IconComponent = ComponentType<{ className?: string }>

// ── Navigation item ─────────────────────────────────────────────────────

export type ShellNavItem = {
  /** Unique key (tab id for Ops Console, or route path). */
  id: string
  label: string
  /** Icon rendered beside the label; also shown as group icon when collapsed. */
  icon?: IconComponent
  /** In-app path / hash, or external URL. */
  href?: string
  /** Route path (alias — used by Trade Frontend's react-router). */
  to?: string
  external?: boolean
  active?: boolean
  onClick?: () => void
  /** Single char shown when sidebar is collapsed (defaults to first letter of label). */
  shortLabel?: string
  /** Nested children — renders as collapsible sub-list under this item. */
  children?: ShellNavItem[]
}

// ── Sub-group within a nav group ────────────────────────────────────────

export type ShellNavSubGroup = {
  label: string
  items: ShellNavItem[]
}

// ── Top-level navigation group ──────────────────────────────────────────

export type ShellNavGroup = {
  label: string
  /** Group-level icon (required for collapsible sidebar icon mode). */
  icon?: IconComponent
  /** Flat items (no sub-group labels). */
  items?: ShellNavItem[]
  /** Grouped items with section labels within this group. */
  subGroups?: ShellNavSubGroup[]
  /** Whether this group starts open (default false). */
  defaultOpen?: boolean
  /** Render a visual divider before this group. */
  dividerBefore?: boolean
}

/** Flatten all items from a group (across subGroups and items) for active-state detection. */
export function getAllNavItems(group: ShellNavGroup): ShellNavItem[] {
  const flat: ShellNavItem[] = []
  if (group.items) flat.push(...group.items)
  if (group.subGroups) {
    for (const sg of group.subGroups) flat.push(...sg.items)
  }
  return flat
}

// ── Peer app link (cross-app navigation) ────────────────────────────────

export type PeerAppLink = {
  label: string
  href: string
  description?: string
}
