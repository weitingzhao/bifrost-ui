export { cn } from './lib/cn'

// ── Layout ──────────────────────────────────────────────────────────────

export { PageShell, type PageShellProps, type PageShellPadding } from './layout/PageShell'
export {
  PageHeader,
  type PageHeaderProps,
  type PageHeaderTitleSize,
} from './layout/PageHeader'
export { SHELL_TOP_BAR_HEIGHT_CLASS } from './layout/shellChrome'

export { BifrostLogoMark, BifrostLogoFull } from './branding/BifrostLogo'

export type {
  ShellNavGroup,
  ShellNavGroupEmphasis,
  ShellNavSubGroup,
  ShellNavItem,
  IconComponent,
  PeerAppLink,
} from './shell/types'
export { getAllNavItems } from './shell/types'
export { ShellNavSidebar, type ShellNavSidebarProps, type ShellNavLinkRenderProps, type ShellNavDocLink } from './shell/ShellNavSidebar'
export {
  defaultMatchActive,
  shellNavMatchByPathPrefix,
  resolveShellNavSlot,
  type ShellNavSlotContent,
} from './shell/shellNavUtils'
export {
  shellNavSubItemButtonClass,
  shellNavSubItemButtonFlexClass,
  shellNavSubItemButtonClassName,
  shellNavSubItemIconClass,
  shellNavPhaseFocusClass,
  shellNavOffPhaseClass,
  shellNavItemSignalClass,
  shellNavItemSignalTitle,
  shellNavExternalLinkIconClass,
  shellNavGroupLabelClass,
  shellNavGroupLabelSecondaryClass,
  shellNavGroupLabelTextClass,
  shellNavSeatZoneClass,
  shellNavPartnerZoneClass,
  shellNavSecondaryCollapseTriggerClass,
  shellNavGroupIconClass,
  shellNavGroupChevronClass,
  shellNavSubGroupSectionLabelClass,
  shellNavChildExpandButtonClass,
  shellNavExpandChevronButtonClass,
  shellNavFlyoutItemActiveClass,
  shellNavFlyoutItemInactiveClass,
  shellNavFlyoutItemClass,
  shellNavFlyoutItemBaseClass,
  shellNavFlyoutSectionTitleClass,
  shellNavCollapsedIconButtonClass,
  shellNavHeaderActionButtonClass,
  shellNavFlyoutDocLinkClass,
  shellNavPeerLinkExpandedClass,
  shellNavPeerLinkTitleClass,
  shellNavPeerLinkExternalIconClass,
  shellNavPeerLinkDescriptionClass,
} from './shell/shellNavClasses'

// ── Data-display primitives ─────────────────────────────────────────────

export { SegmentControl, IncludeExcludeToggle, type SegmentOption } from './data-display/SegmentControl'
export {
  segmentGroupClass,
  segmentButtonClass,
  SEGMENT_CTRL_ACTIVE,
  SEGMENT_CTRL_IDLE,
  DEFAULT_SEGMENT_SIZE,
  type SegmentControlSize,
} from './data-display/segmentClasses'
export {
  StatusLamp,
  type Reachability,
  type AuthStatus,
} from './data-display/StatusLamp'
export { HealthLamp, type HealthLampVariant } from './data-display/HealthLamp'
export { EmptyState } from './data-display/EmptyState'
export { IconActionButton } from './data-display/IconActionButton'
export { ConfirmDialog, type ConfirmDialogProps } from './data-display/ConfirmDialog'
export { DenseTag, DenseTagButton, type DenseTagSize, type DenseTagVariant } from './data-display/DenseTag'
export { denseTagClass } from './data-display/denseTagClasses'
export {
  DenseDataTable,
  DenseTableHeader,
  DenseTableBody,
  DenseTableHeadRow,
  DenseTableRow,
  DenseTableHead,
  DenseTableCell,
  DenseTableSubheadRow,
  DenseTableDetailRow,
} from './data-display/DenseTable'
export {
  denseTable,
  denseTableCellPadding,
  denseTableNumCell,
  denseTableEntityCell,
  denseTableEntityLink,
} from './data-display/denseTableClasses'
export {
  CollapsibleGroup,
  CollapsibleGroupHeader,
  CollapsibleGroupTitle,
  CollapsibleGroupStats,
  CollapsibleGroupBody,
  CollapsibleChevron,
  CollapsibleBucketHeader,
  type CollapsibleGroupVariant,
} from './data-display/CollapsibleGroup'

// ── Hooks ───────────────────────────────────────────────────────────────

export { useIsMobile, MOBILE_BREAKPOINT } from './hooks/use-mobile'

// ── shadcn/ui primitives (shared between Trade & Platform) ──────────────

export { Button, buttonVariants } from './ui/button'
export { Input } from './ui/input'
export { Separator } from './ui/separator'
export { Skeleton } from './ui/skeleton'
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible'
export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover'
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './ui/sheet'
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './ui/sidebar'
