import { cn } from '../lib/cn'

/** Default inactive sub-item; active bg/text from SidebarMenuSubButton base + font-medium */
export const shellNavSubItemButtonClass =
  'cursor-pointer text-sidebar-foreground/60 data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium hover:text-sidebar-foreground'

/** Same as shellNavSubItemButtonClass but flex-1 for parent rows with expand chevron */
export const shellNavSubItemButtonFlexClass =
  'flex-1 cursor-pointer text-sidebar-foreground/60 data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden'

export function shellNavSubItemButtonClassName(options?: {
  flex?: boolean
  indent?: string
  className?: string
}): string {
  return cn(
    options?.flex ? shellNavSubItemButtonFlexClass : shellNavSubItemButtonClass,
    options?.indent,
    options?.className,
  )
}

export const shellNavSubItemIconClass = 'h-3.5 w-3.5 shrink-0 opacity-70'

/**
 * Phase-path marker — inset rail (does not shift layout).
 * Uses Task Mode accent when `data-task-mode` is set; otherwise sidebar primary.
 * Independent of route-selected pill (`data-[active=true]:bg-sidebar-accent`).
 */
export const shellNavPhaseFocusClass =
  'shadow-[inset_2px_0_0_var(--task-mode-accent,var(--sidebar-primary))]'

/** Off-phase (still in lens) — quieter ink only. Never stack whole-row opacity on the selected page. */
export const shellNavOffPhaseClass =
  'text-sidebar-foreground/40 hover:text-sidebar-foreground/65'

export function shellNavItemSignalClass(options: {
  phaseFocus?: boolean
  offPhase?: boolean
}): string | undefined {
  const cls = cn(
    options.phaseFocus === true && shellNavPhaseFocusClass,
    options.offPhase === true && shellNavOffPhaseClass,
  )
  return cls === '' ? undefined : cls
}

export function shellNavItemSignalTitle(options: {
  isActive?: boolean
  phaseFocus?: boolean
  offPhase?: boolean
}): string | undefined {
  const parts: string[] = []
  if (options.isActive === true) parts.push('Current page')
  if (options.phaseFocus === true) parts.push('On current phase path')
  if (options.offPhase === true) parts.push('In lens, not this phase')
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export const shellNavExternalLinkIconClass = 'h-3.5 w-3.5 shrink-0 opacity-50'

export const shellNavGroupLabelClass = 'h-9 cursor-pointer text-[13px] font-semibold tracking-tight'

/** Quieter Support-zone group header (Ground Systems / Subcontractors). */
export const shellNavGroupLabelSecondaryClass =
  'h-8 cursor-pointer text-[11px] font-medium tracking-wide'

export function shellNavGroupLabelTextClass(
  isActive: boolean,
  emphasis?: 'default' | 'secondary',
): string {
  if (emphasis === 'secondary') {
    return isActive ? 'text-sidebar-foreground/70' : 'text-sidebar-foreground/45'
  }
  return isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/80'
}

/** Pinned Seat zone (Mission Control) — outside SidebarContent scroll. */
export const shellNavSeatZoneClass =
  'shrink-0 border-b border-sidebar-border/60 bg-sidebar-accent/5'

/** Pinned Partner zone (Engineer) — outside SidebarContent scroll. */
export const shellNavPartnerZoneClass =
  'shrink-0 border-b border-sidebar-border/60 bg-sidebar-accent/[0.08]'

export function shellNavGroupIconClass(isActive: boolean): string {
  return cn(
    'h-4 w-4 shrink-0',
    isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50',
  )
}

export const shellNavGroupChevronClass =
  'h-3.5 w-3.5 text-sidebar-foreground/40 transition-transform group-data-[state=open]/collapsible:rotate-180'

export const shellNavSubGroupSectionLabelClass =
  'select-none text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/35'

export const shellNavExpandChevronButtonClass =
  'flex h-6 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-sidebar-foreground/30 transition-colors hover:text-sidebar-foreground/70'

export const shellNavChildExpandButtonClass = cn(
  'group-data-[collapsible=icon]:hidden',
  shellNavExpandChevronButtonClass,
)

export const shellNavFlyoutItemActiveClass =
  'bg-sidebar-accent font-medium text-sidebar-accent-foreground'

export const shellNavFlyoutItemInactiveClass =
  'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'

export function shellNavFlyoutItemClass(isActive: boolean): string {
  return isActive ? shellNavFlyoutItemActiveClass : shellNavFlyoutItemInactiveClass
}

export const shellNavFlyoutItemBaseClass =
  'flex cursor-pointer items-center gap-2 rounded-md py-1.5 text-xs transition-colors'

/** Popover section title (group / Docs header) */
export function shellNavFlyoutSectionTitleClass(isActive: boolean): string {
  return cn(
    'px-1 pb-1.5 text-[11px] font-bold tracking-wide',
    isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70',
  )
}

export function shellNavCollapsedIconButtonClass(isActive: boolean): string {
  return cn(
    'mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
    isActive
      ? 'bg-sidebar-accent text-sidebar-primary'
      : 'text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground',
  )
}

export const shellNavHeaderActionButtonClass =
  'flex h-6 w-6 cursor-pointer items-center justify-center rounded text-sidebar-foreground/35 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground'

export const shellNavFlyoutDocLinkClass =
  'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground'

export const shellNavPeerLinkExpandedClass =
  'mx-2 mb-1 block cursor-pointer rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2 text-xs transition-colors hover:border-sidebar-primary/40 hover:bg-sidebar-accent'

export const shellNavPeerLinkTitleClass =
  'flex items-center gap-1.5 font-semibold text-sidebar-primary'

export const shellNavPeerLinkExternalIconClass = 'h-3 w-3 shrink-0 opacity-70'

export const shellNavPeerLinkDescriptionClass =
  'mt-0.5 block text-[10px] leading-snug text-sidebar-foreground/55'
