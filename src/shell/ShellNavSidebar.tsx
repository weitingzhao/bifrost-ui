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
  shellNavNestedSubListClass,
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
  visibleUnderCaptions,
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
  /**
   * Full localStorage key override for folded captions (§5a.7).
   *
   * Separate from `openGroupsStorageKey` because a host that overrides one
   * is overriding a *full* key, not a prefix — there is nothing to append a
   * suffix to. A host that passes `storageKey` instead gets
   * `<storageKey>:captions` and needs neither.
   */
  captionsStorageKey?: string
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
  /**
   * Render rows under the three-kind grammar.
   *
   * Trade's design ruled this on 2026-09-20, replacing an earlier rule of its
   * own ("every parent expands first, navigates second") on the grounds that
   * one row doing two things according to a state the reader cannot see is
   * what made the tree feel split. The kinds:
   *
   *   leaf   no children          no caret        the row navigates
   *   dual   a page AND children  boxed caret     label goes, caret opens
   *   group  a container only     unboxed caret   the row opens, never goes
   *
   * The caret's **frame**, not its position, carries the grammar — position
   * belongs to indent, and a channel doing two jobs is what kept the carets
   * from lining up. Kind is read from the shape, never from the name: a row
   * is a container when it has no destination of its own, or when its
   * destination is one of its own descendants.
   *
   * Opt-in, because it changes what a click does: a consumer whose parent rows
   * are synthetic stand-ins for their first child wants the jump.
   */
  navRowSyntax?: boolean
}

/** One empty set for every host that has no caption folded. */
const EMPTY_CAPTIONS: ReadonlySet<string> = new Set<string>()

type NavRenderOptions = {
  matchActive: (item: ShellNavItem, activeId: string) => boolean
  navRowSyntax?: boolean
  /** Caption ids the reader has folded away (§5a.7). */
  collapsedCaptions?: ReadonlySet<string>
  toggleCaption?: (id: string) => void
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

/**
 * Which captions the reader has folded (§5a.7).
 *
 * Stored as the *collapsed* set rather than the open one, so the default —
 * nothing written yet — is every caption expanded, which is what the design
 * asks for. An open-set default would have to know every caption's id before
 * one had ever been drawn.
 */
function resolveCaptionsKey(
  storageKey: string | undefined,
  captionsStorageKey: string | undefined,
): string | undefined {
  if (captionsStorageKey != null) return captionsStorageKey
  return storageKey == null ? undefined : `${storageKey}:captions`
}

function readCollapsedCaptions(key: string | undefined): Set<string> {
  if (key == null) return new Set()
  try {
    const raw = localStorage.getItem(key)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    /* ignore corrupted localStorage */
  }
  return new Set()
}

function readAccordion(key: string | undefined): boolean {
  if (key == null) return false
  return localStorage.getItem(key) === 'true'
}

/**
 * The navigating half of a heading that is also a page.
 *
 * It renders through the host's own link when there is one, so the address is
 * real — right-click, middle-click and copy all reach the layer's page — and
 * falls back to a button for a host that navigates by id.
 */
function GroupHeadingLink({
  group,
  isActive,
  onSelect,
  renderInAppLink,
  children,
}: {
  group: ShellNavGroup
  isActive: boolean
  onSelect: (item: ShellNavItem) => void
  renderInAppLink?: (props: ShellNavLinkRenderProps) => ReactNode
  children: ReactNode
}) {
  const item: ShellNavItem = { id: group.to as string, label: group.label, to: group.to }
  const inner = <span className="flex min-w-0 items-center gap-2">{children}</span>
  if (renderInAppLink != null) {
    return (
      <>
        {renderInAppLink({
          item,
          isActive,
          children: inner,
          onNavigate: () => onSelect(item),
          variant: 'expanded',
        })}
      </>
    )
  }
  return (
    <button type="button" className="flex min-w-0 items-center" onClick={() => onSelect(item)}>
      {inner}
    </button>
  )
}

function isGroupActive(
  group: ShellNavGroup,
  activeId: string,
  matchActive: (item: ShellNavItem, activeId: string) => boolean,
): boolean {
  // A heading that is also a page counts itself. Reading only the children
  // leaves the one state a reader checks first — "you are here" — missing on
  // exactly the layers whose heading they just clicked.
  if (group.to != null && matchActive({ id: group.to, label: group.label, to: group.to }, activeId)) {
    return true
  }
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

function renderItemMain(
  item: ShellNavItem,
  options: NavRenderOptions,
): ReactNode {
  return (
    <>
      {renderItemLeading(item, options.renderItemIcon)}
      {/* The full name on hover: a narrow rail truncates long labels (objective titles) with an ellipsis. */}
      <span className="flex-1 truncate" title={item.label}>
        {item.label}
      </span>
    </>
  )
}

/** Extras / chevron sit beside the row control — never inside `<a>` / `<button>`. */
function wrapNavRow(main: ReactNode, extras: ReactNode, trailing?: ReactNode): ReactNode {
  if (extras == null && trailing == null) return main
  return (
    <div className="flex min-w-0 items-center gap-0.5">
      {main}
      {extras}
      {trailing}
    </div>
  )
}

/**
 * What kind of row this is, read from its shape.
 *
 * A row is a **container** when it has nowhere of its own to go: no `to`, or a
 * `to` that is really one of its own descendants. That second case is the one
 * naming cannot catch — a fold whose destination is the page sitting one row
 * beneath it looks like a place and is an alias, and clicking it lands you on
 * a child while the row above stays selected.
 */
export function navRowKind(item: ShellNavItem): 'leaf' | 'dual' | 'group' {
  if (item.children == null || item.children.length === 0) return 'leaf'
  const to = item.to ?? item.href ?? null
  if (to == null) return 'group'
  const ownsIt = (node: ShellNavItem): boolean =>
    (node.children ?? []).some((c) => (c.to ?? c.href ?? c.id) === to || ownsIt(c))
  return ownsIt(item) ? 'group' : 'dual'
}

/**
 * A group heading inside the tree (§5a.7).
 *
 * §5a used the caret's shape to tell "a place you can go" from "a thing that
 * only opens". The grammar was right and the channel too narrow: a caret is a
 * 10px cue against the large one — *this looks like a row* — and in a tree
 * where nearly every row is a destination, the large cue wins. So the fix is
 * not a different caret; it is to stop being a row.
 *
 * No icon, no hover surface, no row frame, no address, and it never matches
 * the active route. It is still a `<button>` with `aria-expanded`, because it
 * folds: a heading with a caret beside it is a heading behaving normally, and
 * the ambiguity the Owner first worried about was the row shape, not the
 * click.
 *
 * The rule after the word is drawn **on the caption's own line** rather than
 * above it, so the heading costs horizontal space and no vertical space —
 * Owner 2026-09-21, after a version drawn above it made the menu taller.
 *
 * The ink follows the state: a heading naming rows you can see is doing its
 * job and takes the muted ink; once folded it is only a way back, and drops
 * to the faintest. Dimming both alike would cost the expanded one its naming
 * power, which was the point of having it.
 */
function NavCaption({
  item,
  collapsed,
  onToggle,
}: {
  item: ShellNavItem
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <SidebarMenuSubItem>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        title={collapsed ? `Show ${item.label}` : `Hide ${item.label}`}
        className={cn(
          'flex h-5 w-full items-center gap-1.5 bg-transparent px-1.5 text-left',
          'text-[9px] font-semibold uppercase tracking-[0.12em]',
          collapsed
            ? 'text-sidebar-foreground/35 hover:text-sidebar-foreground/55'
            : 'text-sidebar-foreground/55 hover:text-sidebar-foreground/75',
        )}
      >
        <span className="flex-none">{item.label}</span>
        <ChevronDown
          aria-hidden
          className={cn('h-2.5 w-2.5 flex-none transition-transform', collapsed && '-rotate-90')}
        />
        {/* The rule lives on this line — horizontal cost only. */}
        <span aria-hidden className="ml-1 h-px min-w-2 flex-1 bg-sidebar-border" />
      </button>
    </SidebarMenuSubItem>
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
  if (item.kind === 'caption') {
    return (
      <NavCaption
        item={item}
        collapsed={options.collapsedCaptions?.has(item.id) === true}
        onToggle={() => options.toggleCaption?.(item.id)}
      />
    )
  }
  const isActive = matchActive(item, activeId)
  const hasChildren = item.children != null && item.children.length > 0
  const childActive =
    hasChildren && item.children!.some((child) => matchActive(child, activeId))
  const [childOpen, setChildOpen] = useState(item.defaultOpen === true || isActive || childActive)
  // Clicking a parent lands on its page; the pages beneath it should appear
  // with it, not wait for the chevron. The reader can still fold it away.
  useEffect(() => {
    if (isActive || childActive) setChildOpen(true)
  }, [isActive, childActive])
  // A nested row steps in by one small indent, no more: the default sub-list
  // margins would take a third of the sidebar from a label two levels down.
  const indent = depth > 0 ? 'pl-1' : ''
  const main = renderItemMain(item, options)
  const extras = options.renderItemExtras?.(item)
  const { signalClass, signalTitle } = itemSignalState(item.id, isActive || childActive, options)

  if (hasChildren) {
    const buttonClass = shellNavSubItemButtonClassName({ flex: true, indent, className: signalClass })
    /**
     * The three-kind grammar (Trade design §5a), or the old single behaviour.
     *
     * A **group** row is a container: the whole row opens and closes it and it
     * never navigates, because there is nowhere of its own to go — its `to`,
     * when it has one, is an alias of a child and following it would land you
     * on that child with the parent still selected. A **dual** row is a page
     * that also holds pages: its label goes there, its caret opens the list.
     * That split is the point — one row doing two things according to a state
     * the reader cannot see is what made the tree feel split in the first
     * place.
     */
    const kind = options.navRowSyntax === true ? navRowKind(item) : 'dual'
    const isGroupRow = kind === 'group'
    const rowTitle = signalTitle ?? (isGroupRow ? `${item.label} — a group of pages` : undefined)
    const rowMain = isGroupRow ? (
      // A button, not a link: a container has no address, so it should not
      // offer one to a right-click either.
      <SidebarMenuSubButton
        isActive={isActive || childActive}
        className={cn(buttonClass, 'opacity-[0.78]')}
        title={rowTitle}
        aria-expanded={childOpen}
        onClick={() => setChildOpen((open) => !open)}
      >
        {main}
      </SidebarMenuSubButton>
    ) : renderInAppLink != null && !item.external ? (
      <SidebarMenuSubButton asChild isActive={isActive || childActive} className={buttonClass}>
        {renderInAppLink({
          item,
          isActive: isActive || childActive,
          children: main,
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
        {main}
      </SidebarMenuSubButton>
    )
    const chevron = (
      <button
        type="button"
        onClick={() => setChildOpen((open) => !open)}
        // The frame is the grammar: a boxed caret is its own control beside a
        // label that goes somewhere else; an unboxed one is a handle on a row
        // that is already nothing but this control. Position stays with
        // indent, which is the only job it can hold without fighting.
        className={cn(
          shellNavChildExpandButtonClass,
          !isGroupRow && options.navRowSyntax === true && 'border border-sidebar-border',
        )}
        // On a container the row already toggles; the caret must not undo it.
        tabIndex={isGroupRow ? -1 : undefined}
        aria-hidden={isGroupRow ? true : undefined}
        aria-label={childOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
      >
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', childOpen && 'rotate-180')} />
      </button>
    )
    return (
      <SidebarMenuSubItem>
        {wrapNavRow(rowMain, extras, chevron)}
        {childOpen && (
          <SidebarMenu className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuSub className={shellNavNestedSubListClass}>
              {visibleUnderCaptions(item.children!, options.collapsedCaptions ?? EMPTY_CAPTIONS).map((child) => (
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

  const leafClass = shellNavSubItemButtonClassName({
    flex: extras != null,
    indent,
    className: signalClass,
  })

  if (item.external && item.href != null) {
    return (
      <SidebarMenuSubItem>
        {wrapNavRow(
          <SidebarMenuSubButton asChild isActive={isActive} className={leafClass} title={signalTitle}>
            <a href={item.href} target="_blank" rel="noopener noreferrer">
              {renderItemLeading(item, options.renderItemIcon) ?? (
                <ExternalLink className={shellNavExternalLinkIconClass} aria-hidden />
              )}
              <span className="flex-1">{item.label}</span>
            </a>
          </SidebarMenuSubButton>,
          extras,
        )}
      </SidebarMenuSubItem>
    )
  }

  if (renderInAppLink != null) {
    return (
      <SidebarMenuSubItem>
        {wrapNavRow(
          <SidebarMenuSubButton asChild isActive={isActive} className={leafClass} title={signalTitle}>
            {renderInAppLink({
              item,
              isActive,
              children: main,
              onNavigate: () => onSelect(item),
              variant: 'expanded',
            })}
          </SidebarMenuSubButton>,
          extras,
        )}
      </SidebarMenuSubItem>
    )
  }

  return (
    <SidebarMenuSubItem>
      {wrapNavRow(
        <SidebarMenuSubButton
          isActive={isActive}
          className={leafClass}
          title={signalTitle}
          onClick={() => onSelect(item)}
        >
          {main}
        </SidebarMenuSubButton>,
        extras,
      )}
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
        {visibleUnderCaptions(items, options.collapsedCaptions ?? EMPTY_CAPTIONS).map((item) => (
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
  if (item.kind === 'caption') {
    return (
      <NavCaption
        item={item}
        collapsed={options.collapsedCaptions?.has(item.id) === true}
        onToggle={() => options.toggleCaption?.(item.id)}
      />
    )
  }
  const isActive = matchActive(item, activeId)
  const hasChildren = item.children != null && item.children.length > 0
  const childActive =
    hasChildren && item.children!.some((child) => matchActive(child, activeId))
  const [open, setOpen] = useState(item.defaultOpen === true || isActive || childActive)
  useEffect(() => {
    if (isActive || childActive) setOpen(true)
  }, [isActive, childActive])
  const pl = depth > 0 ? 'pl-5 pr-2' : 'px-2.5'
  const main = renderItemMain(item, options)
  const extras = options.renderItemExtras?.(item)
  const { signalClass, signalTitle } = itemSignalState(item.id, isActive || childActive, options)

  const handleSelect = () => {
    onSelect(item)
    onClose()
  }

  if (item.external && item.href != null) {
    return wrapNavRow(
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className={cn(
          shellNavFlyoutItemBaseClass,
          extras != null && 'flex-1',
          pl,
          shellNavFlyoutItemInactiveClass,
          signalClass,
        )}
        title={signalTitle}
      >
        {renderItemLeading(item, options.renderItemIcon) ?? (
          <ExternalLink className={shellNavExternalLinkIconClass} aria-hidden />
        )}
        <span className="flex-1">{item.label}</span>
      </a>,
      extras,
    )
  }

  const flyoutClassName = cn(
    shellNavFlyoutItemBaseClass,
    'flex-1',
    pl,
    shellNavFlyoutItemClass(isActive || childActive),
    signalClass,
  )

  const rowMain =
    renderInAppLink != null ? (
      renderInAppLink({
        item,
        isActive: isActive || childActive,
        children: main,
        onNavigate: handleSelect,
        variant: 'flyout',
        flyoutClassName,
      })
    ) : (
      <button type="button" onClick={handleSelect} className={flyoutClassName} title={signalTitle}>
        {main}
      </button>
    )
  const chevron = hasChildren ? (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className={shellNavExpandChevronButtonClass}
      aria-label={open ? `Collapse ${item.label}` : `Expand ${item.label}`}
    >
      <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
    </button>
  ) : null

  return (
    <div>
      {wrapNavRow(rowMain, extras, chevron)}
      {hasChildren && open && (
        <div className="mt-0.5 space-y-0.5">
          {visibleUnderCaptions(item.children!, options.collapsedCaptions ?? EMPTY_CAPTIONS).map((child) => (
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
        {/* On the icon rail the rail button must keep opening this flyout —
            otherwise the children are unreachable — so the layer's own page
            is the title row instead. */}
        {group.to != null ? (
          <button
            type="button"
            className={cn(shellNavFlyoutSectionTitleClass(isActive), 'w-full text-left underline decoration-dotted underline-offset-2')}
            onClick={() => {
              onSelect({ id: group.to as string, label: group.label, to: group.to })
              setOpen(false)
            }}
          >
            {group.label}
          </button>
        ) : (
          <p className={shellNavFlyoutSectionTitleClass(isActive)}>{group.label}</p>
        )}

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
            {visibleUnderCaptions(subGroup.items, options.collapsedCaptions ?? EMPTY_CAPTIONS).map((item) => (
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
  captionsStorageKey,
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
  navRowSyntax = false,
}: ShellNavSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const openGroupsKey = resolveOpenGroupsKey(storageKey, openGroupsKeyOverride)
  const isDimmed = useMemo(() => resolveIdChecker(dimmedIds), [dimmedIds])
  const isPhaseFocus = useMemo(() => resolveIdChecker(phaseFocusIds), [phaseFocusIds])
  const captionsKey = resolveCaptionsKey(storageKey, captionsStorageKey)
  const [collapsedCaptions, setCollapsedCaptions] = useState<Set<string>>(() =>
    readCollapsedCaptions(captionsKey),
  )
  useEffect(() => {
    if (captionsKey == null) return
    localStorage.setItem(captionsKey, JSON.stringify([...collapsedCaptions]))
  }, [collapsedCaptions, captionsKey])
  const toggleCaption = useCallback((id: string) => {
    setCollapsedCaptions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const renderOptions: NavRenderOptions = {
    matchActive,
    navRowSyntax,
    renderItemIcon,
    renderItemExtras,
    renderInAppLink,
    isDimmed,
    isPhaseFocus,
    collapsedCaptions,
    toggleCaption,
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
                        {group.to != null && navRowSyntax ? (
                          // A heading that is also a page: the icon and word go
                          // there, the chevron folds. Two controls on one row,
                          // which is the same split a `dual` row makes — and
                          // the reason the whole-row trigger cannot stay is
                          // that it would take both.
                          <div className="flex w-full items-center justify-between px-2 select-none">
                            <GroupHeadingLink
                              group={group}
                              isActive={isActive}
                              onSelect={onSelect}
                              renderInAppLink={renderInAppLink}
                            >
                              {GroupIcon != null && (
                                <GroupIcon className={shellNavGroupIconClass(isActive)} />
                              )}
                              <span>{group.label}</span>
                            </GroupHeadingLink>
                            <CollapsibleTrigger
                              className="flex h-7 w-6 shrink-0 cursor-pointer items-center justify-center rounded"
                              aria-label={isOpen ? `Collapse ${group.label}` : `Expand ${group.label}`}
                            >
                              <ChevronDown className={shellNavGroupChevronClass} />
                            </CollapsibleTrigger>
                          </div>
                        ) : (
                          <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between px-2 select-none">
                            <div className="flex items-center gap-2">
                              {GroupIcon != null && (
                                <GroupIcon className={shellNavGroupIconClass(isActive)} />
                              )}
                              <span>{group.label}</span>
                            </div>
                            <ChevronDown className={shellNavGroupChevronClass} />
                          </CollapsibleTrigger>
                        )}
                      </SidebarGroupLabel>

                      <CollapsibleContent>
                        {group.prefix != null ? <div className="px-1 pt-1">{group.prefix}</div> : null}
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
