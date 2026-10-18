/**
 * `@bifrost/ui/layout` — the layout layer (0.15.0, Trade design Rev .174 A · B,
 * DESIGN_CONTRACTS §18). Its CSS is `@bifrost/ui/styles/layout`.
 *
 * The same names are re-exported from the package root, for a consumer whose
 * bundler alias maps only `@bifrost/ui`.
 */
export {
  LayoutProvider,
  useDocksAt,
  useLayout,
  useLayoutProvided,
  type LayoutProviderProps,
} from './LayoutProvider'
export {
  COMPACT_BELOW,
  DEFAULT_LAYOUT,
  DOCK_MIN_MAIN,
  EXPANDED_BELOW,
  HEIGHT_TIERS,
  LAYOUT_EVENT,
  MEDIUM_BELOW,
  PAGE_FLOOR,
  SHORT_BELOW,
  WIDTH_TIERS,
  crossed,
  dockOf,
  docksAt,
  foldTierOf,
  heightTier,
  inputOf,
  isWidthTier,
  parseLayoutQuery,
  readLayoutAttrs,
  sameLayout,
  widthTier,
  type HeightTier,
  type InputMode,
  type Layout,
  type WidthTier,
} from './layout'
export { LONG_PRESS_MS, LONG_PRESS_SLOP_PX } from './longPress'
export {
  SHEET_DRAG_DOWN_PX,
  SHEET_DRAG_UP_PX,
  SheetGrip,
  sheetRelease,
  type SheetGripProps,
} from './SheetGrip'
export { BottomSheet, type BottomSheetAction, type BottomSheetProps } from './BottomSheet'
export { DetailPane, type DetailPaneProps, type DetailPanePlace } from './DetailPane'
export {
  DOCK_EDGE_PX,
  DOCK_HIDE_AFTER_PX,
  DOCK_SHOW_AFTER_PX,
  dockStep,
  useDockStepAside,
} from './dockStepAside'
export { ensureKeepRule, keepRule, keepValue } from './rowDetail'
export { TabBar, type TabBarItem, type TabBarProps } from '../shell/TabBar'
