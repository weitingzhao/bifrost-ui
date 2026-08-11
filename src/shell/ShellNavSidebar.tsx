import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BookOpen, ChevronDown, ExternalLink, FileText, Layers2, ListTree } from 'lucide-react'
import { BifrostLogoFull, BifrostLogoMark } from '../branding/BifrostLogo'
import { SHELL_TOP_BAR_HEIGHT_CLASS } from '../layout/shellChrome'
import { cn } from '../lib/cn'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '../ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip'
import {
  getAllNavItems,
  type PeerAppLink,
  type ShellNavGroup,
  type ShellNavItem,
} from './types'
import {
  shellNavChildExpandButtonClass,
  shellNavCollapsedIconButtonClass,
  shellNavExpandChevronButtonClass,
  shellNavExternalLinkIconClass,
  shellNavFlyoutDocLinkClass,
  shellNavFlyoutItemBaseClass,
  shellNavFlyoutItemClass,
  shellNavFlyoutItemInactiveClass,
  shellNavFlyoutSectionTitleClass,
  shellNavGroupChevronClass,
  shellNavGroupIconClass,
  shellNavGroupLabelClass,
  shellNavGroupLabelSecondaryClass,
  shellNavGroupLabelTextClass,
  shellNavPartnerZoneClass,
  shellNavSeatZoneClass,
  shellNavHeaderActionButtonClass,
  shellNavPeerLinkDescriptionClass,
  shellNavPeerLinkExpandedClass,
  shellNavPeerLinkExternalIconClass,
  shellNavPeerLinkTitleClass,
  shellNavSubGroupSectionLabelClass,
  shellNavItemSignalClass,
  shellNavItemSignalTitle,
  shellNavSubItemButtonClassName,
  shellNavSubItemIconClass,
} from './shellNavClasses'
import {
  defaultMatchActive,
  resolveShellNavSlot,
  type ShellNavSlotContent,
} from './shellNavUtils'

export type ShellNavDocLink = {
  id: string
  label: string
  href: string
}

export type ShellNavLinkRenderProps = {
  item: ShellNavItem
  isActive: boolean
  children: ReactNode
  onNavigate: () => void
  variant: 'expanded' | 'flyout'
  flyoutClassName?: string
}

export type ShellNavSidebarProps = {
  productName: string
  productBadge?: string
  /** Active view / mode label shown after the product badge (e.g. Satellite Build) */
  productContext?: string
  navGroups: ShellNavGroup[]
  activeId: string
  onSelect: (item: ShellNavItem) => void
  peerApp?: PeerAppLink
  docLinks?: ShellNavDocLink[]
  footer?: ReactNode
  /** localStorage key prefix for open-group persistence */
  storageKey?: string
  /** Full localStorage key override for open groups */
  openGroupsStorageKey?: string
  /** When set, enables single/multi accordion mode with header toggle */
  accordionStorageKey?: string
  matchActive?: (item: ShellNavItem, activeId: string) => boolean
  renderItemIcon?: (item: ShellNavItem) => ReactNode
  renderItemExtras?: (item: ShellNavItem) => ReactNode
  renderInAppLink?: (props: ShellNavLinkRenderProps) => ReactNode
  headerActions?: ReactNode
  /** Pinned below the logo header, above the scrollable nav — e.g. mode switcher rail */
  navPrefix?: ShellNavSlotContent
  /**
   * Pinned Seat zone (e.g. Mission Control) — shrink-0, never inside SidebarContent scroll.
   * Omit for Trade / consumers that only use navGroups.
   */
  seatContent?: ShellNavSlotContent
  /**
   * Pinned Partner zone (e.g. Engineer) — shrink-0, below Seat, outside scroll.
   * Internal collapsibles in the slot control height; do not dump this into SidebarContent.
   */
  partnerContent?: ShellNavSlotContent
  /**
   * Nav item ids quieter than in-lens peers (still clickable).
   * Off-phase tabs: muted ink only — never whole-row opacity, never applied to the active route.
   */
  dimmedIds?: Set<string> | string[]
  /**
   * Nav item ids on the current Task Mode phase path.
   * Visual: inset accent rail — independent of the route-selected pill.
   */
  phaseFocusIds?: Set<string> | string[]
}

type NavRenderOptions = {
  matchActive: (item: ShellNavItem, activeId: string) => boolean
  renderItemIcon?: (item: ShellNavItem) => ReactNode
  renderItemExtras?: (item: ShellNavItem) => ReactNode
  renderInAppLink?: (props: ShellNavLinkRenderProps) => ReactNode
  isDimmed?: (id: string) => boolean
  isPhaseFocus?: (id: string) => boolean
}

function resolveIdChecker(
  ids: Set<string> | string[] | undefined,
): ((id: string) => boolean) | undefined {
  if (ids == null) return undefined
  if (ids instanceof Set) {
    return (id: string) => ids.has(id)
  }
  const set = new Set(ids)
  return (id: string) => set.has(id)
}

function itemSignalState(
  itemId: string,
  isActive: boolean,
  options: Pick<NavRenderOptions, 'isDimmed' | 'isPhaseFocus'>,
): { signalClass: string | undefined; signalTitle: string | undefined } {
  const phaseFocus = options.isPhaseFocus?.(itemId) === true
  const offPhase = !isActive && options.isDimmed?.(itemId) === true
  return {
    signalClass: shellNavItemSignalClass({ phaseFocus, offPhase }),
    signalTitle: shellNavItemSignalTitle({ isActive, phaseFocus, offPhase }),
  }
}

function resolveOpenGroupsKey(
  storageKey: string | undefined,
  openGroupsStorageKey: string | undefined,
): string | undefined {
  if (openGroupsStorageKey != null) return openGroupsStorageKey
  if (storageKey == null) return undefined
  return `${storageKey}:openGroups`
}

function readOpenGroups(
  key: string | undefined,
  defaultLabels: string[],
): Set<string> {
  if (key == null) return new Set(defaultLabels)
  try {
    const raw = localStorage.getItem(key)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    /* ignore corrupted localStorage */
  }
  return new Set(defaultLabels)
}

function saveOpenGroups(key: string | undefined, groups: Set<string>) {
  if (key == null) return
  localStorage.setItem(key, JSON.stringify([...groups]))
}

function readAccordion(key: string | undefined): boolean {
  if (key == null) return false
  return localStorage.getItem(key) === 'true'
}

function isGroupActive(
  group: ShellNavGroup,
  activeId: string,
  matchActive: (item: ShellNavItem, activeId: string) => boolean,
): boolean {
  return getAllNavItems(group).some((item) => matchActive(item, activeId))
}

function defaultOpenGroupLabels(
  navGroups: ShellNavGroup[],
  activeId: string,
  matchActive: (item: ShellNavItem, activeId: string) => boolean,
): string[] {
  const activeGroup = navGroups.find((group) => isGroupActive(group, activeId, matchActive))
  return navGroups
    .filter((group) => group.defaultOpen || group.label === activeGroup?.label)
    .map((group) => group.label)
}

function renderDefaultItemIcon(item: ShellNavItem): ReactNode {
  const ItemIcon = item.icon
  if (ItemIcon == null) return null
  return <ItemIcon className={shellNavSubItemIconClass} aria-hidden />
}

function renderItemLeading(item: ShellNavItem, renderItemIcon?: (item: ShellNavItem) => ReactNode): ReactNode {
  return renderItemIcon != null ? renderItemIcon(item) : renderDefaultItemIcon(item)
}

function renderItemContent(
  item: ShellNavItem,
  options: NavRenderOptions,
): ReactNode {
  return (
    <>
      {renderItemLeading(item, options.renderItemIcon)}
      <span className="flex-1">{item.label}</span>
      {options.renderItemExtras?.(item)}
    </>
  )
}

// ── Expanded sub-item ───────────────────────────────────────────────────

function NavSubItem({
  item,
  activeId,
  onSelect,
  depth = 0,
  options,
}: {
  item: ShellNavItem
  activeId: string
  onSelect: (item: ShellNavItem) => void
  depth?: number
  options: NavRenderOptions
}) {
  const { matchActive, renderInAppLink } = options
  const isActive = matchActive(item, activeId)
  const hasChildren = item.children != null && item.children.length > 0
  const childActive =
    hasChildren && item.children!.some((child) => matchActive(child, activeId))
  const [childOpen, setChildOpen] = useState(isActive || childActive)
  const indent = depth > 0 ? 'pl-4' : ''
  const content = renderItemContent(item, options)
  const { signalClass, signalTitle } = itemSignalState(item.id, isActive || childActive, options)

  if (hasChildren) {
    const buttonClass = shellNavSubItemButtonClassName({ flex: true, indent, className: signalClass })
    return (
      <SidebarMenuSubItem>
        <div className="flex items-center gap-0.5">
          {renderInAppLink != null && !item.external ? (
            <SidebarMenuSubButton asChild isActive={isActive || childActive} className={buttonClass}>
              {renderInAppLink({
                item,
                isActive: isActive || childActive,
                children: content,
                onNavigate: () => onSelect(item),
                variant: 'expanded',
              })}
            </SidebarMenuSubButton>
          ) : (
            <SidebarMenuSubButton
              isActive={isActive || childActive}
              className={buttonClass}
              title={signalTitle}
              onClick={() => onSelect(item)}
            >
              {content}
            </SidebarMenuSubButton>
          )}
          <button
            type="button"
            onClick={() => setChildOpen((open) => !open)}
            className={shellNavChildExpandButtonClass}
            aria-label={childOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform', childOpen && 'rotate-180')} />
          </button>
        </div>
        {childOpen && (
          <SidebarMenu className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuSub>
              {item.children!.map((child) => (
                <NavSubItem
                  key={child.id}
                  item={child}
                  activeId={activeId}
                  onSelect={onSelect}
                  depth={depth + 1}
                  options={options}
                />
              ))}
            </SidebarMenuSub>
          </SidebarMenu>
        )}
      </SidebarMenuSubItem>
    )
  }

  if (item.external && item.href != null) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          isActive={isActive}
          className={shellNavSubItemButtonClassName({ indent, className: signalClass })}
          title={signalTitle}
        >
          <a href={item.href} target="_blank" rel="noopener noreferrer">
            {renderItemLeading(item, options.renderItemIcon) ?? (
              <ExternalLink className={shellNavExternalLinkIconClass} aria-hidden />
            )}
            <span className="flex-1">{item.label}</span>
            {options.renderItemExtras?.(item)}
          </a>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  if (renderInAppLink != null) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          isActive={isActive}
          className={shellNavSubItemButtonClassName({ indent, className: signalClass })}
          title={signalTitle}
        >
          {renderInAppLink({
            item,
            isActive,
            children: content,
            onNavigate: () => onSelect(item),
            variant: 'expanded',
          })}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        isActive={isActive}
        className={shellNavSubItemButtonClassName({ indent, className: signalClass })}
        title={signalTitle}
        onClick={() => onSelect(item)}
      >
        {content}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

function renderGroupItems(
  items: ShellNavItem[],
  activeId: string,
  onSelect: (item: ShellNavItem) => void,
  options: NavRenderOptions,
) {
  return (
    <SidebarMenu>
      <SidebarMenuSub>
        {items.map((item) => (
          <NavSubItem
            key={item.id}
            item={item}
            activeId={activeId}
            onSelect={onSelect}
            options={options}
          />
        ))}
      </SidebarMenuSub>
    </SidebarMenu>
  )
}

// ── Collapsed flyout item ───────────────────────────────────────────────

function FlyoutNavItem({
  item,
  activeId,
  onSelect,
  onClose,
  depth = 0,
  options,
}: {
  item: ShellNavItem
  activeId: string
  onSelect: (item: ShellNavItem) => void
  onClose: () => void
  depth?: number
  options: NavRenderOptions
}) {
  const { matchActive, renderInAppLink } = options
  const isActive = matchActive(item, activeId)
  const hasChildren = item.children != null && item.children.length > 0
  const childActive =
    hasChildren && item.children!.some((child) => matchActive(child, activeId))
  const [open, setOpen] = useState(isActive || childActive)
  const pl = depth > 0 ? 'pl-5 pr-2' : 'px-2.5'
  const content = renderItemContent(item, options)
  const { signalClass, signalTitle } = itemSignalState(item.id, isActive || childActive, options)

  const handleSelect = () => {
    onSelect(item)
    onClose()
  }

  if (item.external && item.href != null) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className={cn(shellNavFlyoutItemBaseClass, pl, shellNavFlyoutItemInactiveClass, signalClass)}
        title={signalTitle}
      >
        {renderItemLeading(item, options.renderItemIcon) ?? (
          <ExternalLink className={shellNavExternalLinkIconClass} aria-hidden />
        )}
        <span className="flex-1">{item.label}</span>
        {options.renderItemExtras?.(item)}
      </a>
    )
  }

  const flyoutClassName = cn(
    shellNavFlyoutItemBaseClass,
    'flex-1',
    pl,
    shellNavFlyoutItemClass(isActive || childActive),
    signalClass,
  )

  return (
    <div>
      <div className="flex items-center">
        {renderInAppLink != null ? (
          renderInAppLink({
            item,
            isActive: isActive || childActive,
            children: content,
            onNavigate: handleSelect,
            variant: 'flyout',
            flyoutClassName,
          })
        ) : (
          <button type="button" onClick={handleSelect} className={flyoutClassName} title={signalTitle}>
            {content}
          </button>
        )}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={shellNavExpandChevronButtonClass}
            aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
          >
            <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <FlyoutNavItem
              key={child.id}
              item={child}
              activeId={activeId}
              onSelect={onSelect}
              onClose={onClose}
              depth={depth + 1}
              options={options}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CollapsedGroupButton({
  group,
  activeId,
  onSelect,
  options,
}: {
  group: ShellNavGroup
  activeId: string
  onSelect: (item: ShellNavItem) => void
  options: NavRenderOptions
}) {
  const isActive = isGroupActive(group, activeId, options.matchActive)
  const [open, setOpen] = useState(false)
  const GroupIcon = group.icon

  if (GroupIcon == null) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                shellNavCollapsedIconButtonClass(isActive),
                group.emphasis === 'secondary' && 'opacity-60',
              )}
            >
              <GroupIcon className="h-4 w-4 shrink-0" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {group.label}
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-48 border-sidebar-border bg-sidebar p-2 shadow-xl"
      >
        <p className={shellNavFlyoutSectionTitleClass(isActive)}>{group.label}</p>

        {group.items?.map((item) => (
          <FlyoutNavItem
            key={item.id}
            item={item}
            activeId={activeId}
            onSelect={onSelect}
            onClose={() => setOpen(false)}
            options={options}
          />
        ))}

        {group.subGroups?.map((subGroup, index) => (
          <div key={subGroup.label !== '' ? subGroup.label : `ungrouped-${index}`}>
            {index > 0 && <div className="my-1.5 border-t border-sidebar-border/50" />}
            {subGroup.label !== '' ? (
              <p className={cn(shellNavSubGroupSectionLabelClass, 'px-1 pt-1 pb-0.5')}>
                {subGroup.label}
              </p>
            ) : null}
            {subGroup.items.map((item) => (
              <FlyoutNavItem
                key={item.id}
                item={item}
                activeId={activeId}
                onSelect={onSelect}
                onClose={() => setOpen(false)}
                options={options}
              />
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function CollapsedDocsButton({ docLinks }: { docLinks: ShellNavDocLink[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" className={shellNavCollapsedIconButtonClass(false)}>
              <FileText className="h-4 w-4 shrink-0" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          Docs
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-48 border-sidebar-border bg-sidebar p-2 shadow-xl"
      >
        <p className={shellNavFlyoutSectionTitleClass(false)}>Docs</p>
        {docLinks.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={shellNavFlyoutDocLinkClass}
          >
            <ExternalLink className={shellNavExternalLinkIconClass} aria-hidden />
            <span>{link.label}</span>
          </a>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function ShellPeerAppLink({
  peerApp,
  collapsed,
}: {
  peerApp: PeerAppLink
  collapsed: boolean
}) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={peerApp.href}
            target="_blank"
            rel="noopener noreferrer"
            className={shellNavCollapsedIconButtonClass(false)}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">
          {peerApp.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <a
      href={peerApp.href}
      target="_blank"
      rel="noopener noreferrer"
      className={shellNavPeerLinkExpandedClass}
    >
      <span className={shellNavPeerLinkTitleClass}>
        {peerApp.label}
        <ExternalLink className={shellNavPeerLinkExternalIconClass} />
      </span>
      {peerApp.description != null && peerApp.description !== '' && (
        <span className={shellNavPeerLinkDescriptionClass}>
          {peerApp.description}
        </span>
      )}
    </a>
  )
}

function DocsNavGroup({ docLinks }: { docLinks: ShellNavDocLink[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold tracking-tight text-sidebar-foreground/70">
        <BookOpen className="mr-2 h-4 w-4 shrink-0 text-sidebar-foreground/50" />
        Docs
      </SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuSub>
          {docLinks.map((link) => (
            <SidebarMenuSubItem key={link.id}>
              <SidebarMenuSubButton asChild className={shellNavSubItemButtonClassName()}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className={shellNavExternalLinkIconClass} aria-hidden />
                  <span>{link.label}</span>
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenu>
    </SidebarGroup>
  )
}

function AccordionHeaderToggle({
  accordion,
  onToggle,
}: {
  accordion: boolean
  onToggle: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          className={shellNavHeaderActionButtonClass}
          aria-label={
            accordion
              ? 'Nav groups: single expand (switch to multi)'
              : 'Nav groups: multi expand (switch to single)'
          }
        >
          {accordion ? (
            <ListTree className="h-4 w-4" aria-hidden />
          ) : (
            <Layers2 className="h-4 w-4" aria-hidden />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {accordion
          ? 'Single expand — click for multi-open groups'
          : 'Multi expand — click for single-open groups'}
      </TooltipContent>
    </Tooltip>
  )
}

// ── Main sidebar ────────────────────────────────────────────────────────

export function ShellNavSidebar({
  productName,
  productBadge,
  productContext,
  navGroups,
  activeId,
  onSelect,
  peerApp,
  docLinks = [],
  footer,
  storageKey,
  openGroupsStorageKey: openGroupsKeyOverride,
  accordionStorageKey,
  matchActive = defaultMatchActive,
  renderItemIcon,
  renderItemExtras,
  renderInAppLink,
  headerActions,
  navPrefix,
  seatContent,
  partnerContent,
  dimmedIds,
  phaseFocusIds,
}: ShellNavSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const openGroupsKey = resolveOpenGroupsKey(storageKey, openGroupsKeyOverride)
  const isDimmed = useMemo(() => resolveIdChecker(dimmedIds), [dimmedIds])
  const isPhaseFocus = useMemo(() => resolveIdChecker(phaseFocusIds), [phaseFocusIds])
  const renderOptions: NavRenderOptions = {
    matchActive,
    renderItemIcon,
    renderItemExtras,
    renderInAppLink,
    isDimmed,
    isPhaseFocus,
  }

  const [accordion, setAccordion] = useState<boolean>(() => readAccordion(accordionStorageKey))

  const [openGroups, setOpenGroups] = useState<Set<string>>(() =>
    readOpenGroups(
      openGroupsKey,
      defaultOpenGroupLabels(navGroups, activeId, matchActive),
    ),
  )

  useEffect(() => {
    saveOpenGroups(openGroupsKey, openGroups)
  }, [openGroups, openGroupsKey])

  useEffect(() => {
    if (accordionStorageKey == null) return
    localStorage.setItem(accordionStorageKey, String(accordion))
  }, [accordion, accordionStorageKey])

  const toggleGroup = useCallback(
    (label: string) => {
      setOpenGroups((prev) => {
        const next = new Set(prev)
        if (next.has(label)) {
          next.delete(label)
        } else {
          if (accordion) next.clear()
          next.add(label)
        }
        return next
      })
    },
    [accordion],
  )

  const toggleAccordion = useCallback(() => {
    setAccordion((prev) => {
      const next = !prev
      if (next) {
        const activeGroup = navGroups.find((group) =>
          isGroupActive(group, activeId, matchActive),
        )
        setOpenGroups(activeGroup != null ? new Set([activeGroup.label]) : new Set())
      }
      return next
    })
  }, [activeId, matchActive, navGroups])

  const logoLabel = `${productName} logo`
  const showAccordionToggle = accordionStorageKey != null
  const expandedHeaderActions =
    headerActions ??
    (showAccordionToggle ? (
      <AccordionHeaderToggle accordion={accordion} onToggle={toggleAccordion} />
    ) : null)

  const resolvedNavPrefix = resolveShellNavSlot(navPrefix, isCollapsed)
  const resolvedSeat = resolveShellNavSlot(seatContent, isCollapsed)
  const resolvedPartner = resolveShellNavSlot(partnerContent, isCollapsed)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader
        className={cn(
          SHELL_TOP_BAR_HEIGHT_CLASS,
          'flex flex-row items-center gap-0 border-b border-sidebar-border p-0 px-3',
        )}
      >
        {isCollapsed ? (
          <div className="flex w-full items-center justify-center">
            <BifrostLogoMark size={28} productLabel={logoLabel} />
          </div>
        ) : (
          <div className="flex w-full min-h-0 items-center justify-between">
            <BifrostLogoFull
              badge={productBadge}
              contextLabel={productContext}
              productSubtitle={productBadge != null ? '' : productName.replace(/^Bifrost\s*/i, '')}
              productLabel={logoLabel}
            />
            {expandedHeaderActions}
          </div>
        )}
      </SidebarHeader>

      {resolvedNavPrefix != null && (
        <div className="shrink-0 border-b border-sidebar-border/60 bg-sidebar">
          {resolvedNavPrefix}
        </div>
      )}

      {resolvedSeat != null && (
        <div className={shellNavSeatZoneClass}>{resolvedSeat}</div>
      )}

      {resolvedPartner != null && (
        <div className={shellNavPartnerZoneClass}>{resolvedPartner}</div>
      )}

      <SidebarContent>
        {isCollapsed ? (
          <div className="flex flex-col gap-1 px-1 py-2">
            {navGroups.map((group) => (
              <div key={group.label}>
                {group.dividerBefore === true && (
                  <div className="my-1.5 border-t border-sidebar-border/60" />
                )}
                <CollapsedGroupButton
                  group={group}
                  activeId={activeId}
                  onSelect={onSelect}
                  options={renderOptions}
                />
              </div>
            ))}
            {docLinks.length > 0 && <CollapsedDocsButton docLinks={docLinks} />}
          </div>
        ) : (
          <>
            {navGroups.map((group) => {
              const isActive = isGroupActive(group, activeId, matchActive)
              const isOpen = openGroups.has(group.label)
              const GroupIcon = group.icon

              return (
                <div key={group.label}>
                  {group.dividerBefore === true && <SidebarSeparator />}
                  <SidebarGroup>
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleGroup(group.label)}
                      className="group/collapsible"
                    >
                      <SidebarGroupLabel
                        asChild
                        className={cn(
                          group.emphasis === 'secondary'
                            ? shellNavGroupLabelSecondaryClass
                            : shellNavGroupLabelClass,
                          shellNavGroupLabelTextClass(isActive, group.emphasis),
                        )}
                      >
                        <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-2 select-none">
                          <div className="flex items-center gap-2">
                            {GroupIcon != null && (
                              <GroupIcon className={shellNavGroupIconClass(isActive)} />
                            )}
                            <span>{group.label}</span>
                          </div>
                          <ChevronDown className={shellNavGroupChevronClass} />
                        </CollapsibleTrigger>
                      </SidebarGroupLabel>

                      <CollapsibleContent>
                        {group.items != null &&
                          renderGroupItems(group.items, activeId, onSelect, renderOptions)}

                        {group.subGroups?.map((subGroup, index) => (
                          <div key={subGroup.label !== '' ? subGroup.label : `ungrouped-${index}`}>
                            {subGroup.label !== '' ? (
                              <div className="mx-3 mb-0.5 mt-3 flex items-center gap-2">
                                <span className={shellNavSubGroupSectionLabelClass}>
                                  {subGroup.label}
                                </span>
                                <div className="flex-1 border-t border-sidebar-border/50" />
                              </div>
                            ) : null}
                            {renderGroupItems(subGroup.items, activeId, onSelect, renderOptions)}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarGroup>
                </div>
              )
            })}
            {docLinks.length > 0 && <DocsNavGroup docLinks={docLinks} />}
          </>
        )}
      </SidebarContent>

      {(peerApp != null || footer != null) && (
        <SidebarFooter className="border-t border-sidebar-border">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-1 py-1">
              {peerApp != null && <ShellPeerAppLink peerApp={peerApp} collapsed />}
              {footer}
            </div>
          ) : (
            <>
              {peerApp != null && <ShellPeerAppLink peerApp={peerApp} collapsed={false} />}
              {footer}
            </>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
