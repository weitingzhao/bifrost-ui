export { cn } from './lib/cn'

// ── Layout ──────────────────────────────────────────────────────────────

export { PageShell, type PageShellProps, type PageShellPadding } from './layout/PageShell'
export {
  PageHeader,
  type PageHeaderProps,
  type PageHeaderTitleSize,
} from './layout/PageHeader'
export {
  PageHead,
  PageHeadAction,
  type PageHeadProps,
  type PageHeadTab,
  type PageHeadActionProps,
} from './layout/PageHead'
export { SHELL_TOP_BAR_HEIGHT_CLASS } from './layout/shellChrome'
export { SectionBand } from './layout/SectionBand'
export { PanelHead } from './layout/PanelHead'

// design-keep: brand marks. Neither app imports them; Design previews and
// componentSrcMap do, and the design agent needs the .d.ts
// (.design-sync/NOTES.md, .design-sync/config.json).
export { BifrostLogoMark, BifrostLogoFull } from './branding/BifrostLogo'

export type {
  ShellNavGroup,
  ShellNavSubGroup,
  ShellNavItem,
  IconComponent,
} from './shell/types'
export { getAllNavItems } from './shell/types'
export { ShellNavSidebar, type ShellNavLinkRenderProps } from './shell/ShellNavSidebar'
export { shellNavFilterIndex, shellNavFilterMatch, type ShellNavFilterEntry } from './shell/shellNavFilterModel'
export {
  shellNavMatchByPathPrefix,
  visibleUnderCaptions,
  captionsOf,
} from './shell/shellNavUtils'
export {
  shellNavSubItemButtonClassName,
  shellNavSubItemIconClass,
  shellNavItemSignalClass,
  shellNavItemSignalTitle,
  shellNavSecondaryCollapseTriggerClass,
  shellNavSubGroupSectionLabelClass,
  shellNavFlyoutItemClass,
  shellNavFlyoutItemBaseClass,
  shellNavFlyoutSectionTitleClass,
  shellNavCollapsedIconButtonClass,
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
} from './data-display/StatusLamp'
export { HealthLamp, type HealthLampVariant } from './data-display/HealthLamp'
export { EmptyState } from './data-display/EmptyState'
export { ViewState, setViewStateReportHandler, type ViewStateKind } from './data-display/ViewState'
export { ToolbarClear } from './data-display/ToolbarClear'
export { IconActionButton } from './data-display/IconActionButton'
export { ConfirmDialog, type ConfirmDialogProps } from './data-display/ConfirmDialog'
export { DenseTag, DenseTagButton, type DenseTagVariant } from './data-display/DenseTag'
export { DENSE_TAG_SHELL } from './data-display/denseTagClasses'
export { NumberField } from './data-display/NumberField'
export { NUMERIC, stepValue } from './data-display/numberStep'
// design-keep: KPI row. No app imports these; the 0.5.0 Design preview and
// componentSrcMap pin both (.design-sync/NOTES.md, .design-sync/previews/KpiStrip.tsx).
export { KpiCard, KpiStrip } from './data-display/Kpi'
export { FilterBar } from './data-display/FilterBar'
export { InspectorPanel, InspectorField } from './data-display/InspectorPanel'
export { TokenSearchField, type SearchToken, type TokenSuggestion } from './data-display/TokenSearchField'
export { UndoToast } from './data-display/UndoToast'
export {
  FilterChip,
  FilterTray,
  FilterGroup,
  filterGroupState,
  nextGroupValue,
} from './data-display/FilterChip'
export {
  CalendarGrid,
  CalendarNav,
  type CalendarDayContext,
} from './data-display/CalendarGrid'
export { MiniMonth } from './data-display/MiniMonth'
export { TimeStrip } from './data-display/TimeStrip'
export {
  isoAddDays,
  isoDow,
  isWeekendIso,
  shiftIsoMonth,
  isoDaysBetween,
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  formatRelativeDays,
  stripDates,
} from './lib/calendarDates'
// design-keep: scroll band under a toolbar. The Design preview and
// componentSrcMap pin it; neither app imports it
// (.design-sync/config.json, .design-sync/previews).
export { ScrollEdge } from './layout/ScrollEdge'
export {
  useStuckMarks,
  markStuck,
  isStuck,
  isHeadStuck,
  isScrolledX,
} from './layout/stuck'
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
  DenseList,
  DenseListHead,
  DenseListRow,
} from './data-display/DenseList'
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
  sheetEnter,
} from './ui/dialog'
// design-keep: shadcn ContextMenu parts. No app imports them; each sub-export
// is a component the design agent needs a .d.ts for
// (.design-sync/NOTES.md "Discovery / grouping", componentSrcMap).
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from './ui/context-menu'
// design-keep: SheetTrigger, SheetClose and SheetFooter have no app importer.
// Sheet* sub-exports stay public so the design agent keeps their .d.ts
// (.design-sync/NOTES.md "Discovery / grouping", componentSrcMap).
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
