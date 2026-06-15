export { cn } from './lib/cn'

// ── Layout ──────────────────────────────────────────────────────────────

export { PageShell, type PageShellProps, type PageShellPadding } from './layout/PageShell'
export {
  PageHeader,
  type PageHeaderProps,
  type PageHeaderTitleSize,
} from './layout/PageHeader'

// ── Legacy shell (deprecated — migrate to shadcn Sidebar) ───────────────

export { MonitoringShell } from './shell/MonitoringShell'
export { ShellSidebar } from './shell/ShellSidebar'
export { ShellSidebarProvider, useShellSidebar } from './shell/ShellSidebarContext'
export { ShellSidebarTrigger } from './shell/ShellSidebarTrigger'
export { PeerAppLinkCard } from './shell/PeerAppLink'
export type {
  MonitoringShellProps,
  ShellNavGroup,
  ShellNavSubGroup,
  ShellNavItem,
  IconComponent,
  PeerAppLink,
} from './shell/types'
export { getAllNavItems } from './shell/types'

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
