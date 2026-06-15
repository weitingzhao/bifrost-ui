import { cn } from '../lib/cn'

/** Default inactive sub-item; active bg/text from SidebarMenuSubButton base + font-medium */
export const shellNavSubItemButtonClass =
  'text-sidebar-foreground/60 data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium hover:text-sidebar-foreground'

/** Same as shellNavSubItemButtonClass but flex-1 for parent rows with expand chevron */
export const shellNavSubItemButtonFlexClass =
  'flex-1 text-sidebar-foreground/60 data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden'

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

export const shellNavExternalLinkIconClass = 'h-3.5 w-3.5 shrink-0 opacity-50'

export const shellNavGroupLabelClass = 'h-9 text-[13px] font-semibold tracking-tight'

export function shellNavGroupLabelTextClass(isActive: boolean): string {
  return isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/80'
}

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
  'flex h-6 w-5 shrink-0 items-center justify-center rounded text-sidebar-foreground/30 transition-colors hover:text-sidebar-foreground/70'

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
  'flex items-center gap-2 rounded-md py-1.5 text-xs transition-colors'

/** Popover section title (group / Docs header) */
export function shellNavFlyoutSectionTitleClass(isActive: boolean): string {
  return cn(
    'px-1 pb-1.5 text-[11px] font-bold tracking-wide',
    isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/70',
  )
}

export function shellNavCollapsedIconButtonClass(isActive: boolean): string {
  return cn(
    'mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors',
    isActive
      ? 'bg-sidebar-accent text-sidebar-primary'
      : 'text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground',
  )
}

export const shellNavHeaderActionButtonClass =
  'flex h-6 w-6 items-center justify-center rounded text-sidebar-foreground/35 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground'

export const shellNavFlyoutDocLinkClass =
  'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground'

export const shellNavPeerLinkExpandedClass =
  'mx-2 mb-1 block rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2 text-xs transition-colors hover:border-sidebar-primary/40 hover:bg-sidebar-accent'

export const shellNavPeerLinkTitleClass =
  'flex items-center gap-1.5 font-semibold text-sidebar-primary'

export const shellNavPeerLinkExternalIconClass = 'h-3 w-3 shrink-0 opacity-70'

export const shellNavPeerLinkDescriptionClass =
  'mt-0.5 block text-[10px] leading-snug text-sidebar-foreground/55'
