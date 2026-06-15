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
  ShellNavSubGroup,
  ShellNavItem,
  IconComponent,
  PeerAppLink,
} from './shell/types'
export { getAllNavItems } from './shell/types'
export { ShellNavSidebar, type ShellNavSidebarProps, type ShellNavLinkRenderProps, type ShellNavDocLink } from './shell/ShellNavSidebar'
export { defaultMatchActive, shellNavMatchByPathPrefix } from './shell/shellNavUtils'
export {
  shellNavSubItemButtonClass,
  shellNavSubItemButtonFlexClass,
  shellNavSubItemButtonClassName,
  shellNavSubItemIconClass,
  shellNavExternalLinkIconClass,
  shellNavGroupLabelClass,
  shellNavGroupLabelTextClass,
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

export { SegmentControl, type SegmentOption } from './data-display/SegmentControl'
export {
  segmentGroupClass,
  segmentButtonClass,
  type SegmentControlSize,
} from './data-display/segmentClasses'
export {
  StatusLamp,
  type Reachability,
  type AuthStatus,
} from './data-display/StatusLamp'

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
