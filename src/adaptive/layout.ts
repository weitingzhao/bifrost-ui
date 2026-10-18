/**
 * The layout axes (Trade design Rev .164 → .174, DESIGN_CONTRACTS §18.1 · §18.12),
 * as pure functions — the rules on their own, for the provider and for a test.
 *
 * One page for every screen, adapted along three axes and never by the device:
 *
 * - **width** of the window (or of a panel's own box): `compact` < 600 ·
 *   `medium` < 1024 · `expanded` < 1440 · `wide`;
 * - **height**: `short` < 900 · `tall`;
 * - **input**: the last pointer that touched the page — a finger is `touch`;
 *   a mouse, a pen or a trackpad is `pointer`. A key pressed outside a text
 *   field means a hardware keyboard: `keys`.
 *
 * `dock` is the wide standard layout's verdict (§18.12): the width class is
 * `wide` and `main` — the whole content area right of the sidebar, never the
 * scroller inside it — is at least 1200 wide.
 */

export type WidthTier = 'compact' | 'medium' | 'expanded' | 'wide'
export type HeightTier = 'short' | 'tall'
export type InputMode = 'touch' | 'pointer'

export interface Layout {
  w: WidthTier
  h: HeightTier
  input: InputMode
  /** A key was pressed outside a text field: key hints show even on touch. */
  keys: boolean
  /** wide and `main` ≥ 1200: a page's detail docks as a column (§18.12). */
  dock: boolean
}

export const WIDTH_TIERS: readonly WidthTier[] = ['compact', 'medium', 'expanded', 'wide']
export const HEIGHT_TIERS: readonly HeightTier[] = ['short', 'tall']

/** Upper bounds (exclusive) of the width classes. */
export const COMPACT_BELOW = 600
export const MEDIUM_BELOW = 1024
export const EXPANDED_BELOW = 1440
/** Height under this is `short`. */
export const SHORT_BELOW = 900
/** `main` at least this wide (and the class `wide`) docks the detail. */
export const DOCK_MIN_MAIN = 1200

/** The event fired on `window` when a class, the input or the dock verdict changes. */
export const LAYOUT_EVENT = 'bifrost:layout'

/**
 * What a component sees with no `LayoutProvider` above it: a desktop with a
 * mouse. `dock` is false — nothing measured `main` — so a `DetailPane` floats
 * over its parent rather than asking the page for a column.
 */
export const DEFAULT_LAYOUT: Layout = Object.freeze({
  w: 'wide',
  h: 'tall',
  input: 'pointer',
  keys: false,
  dock: false,
}) as Layout

export function widthTier(px: number): WidthTier {
  if (px < COMPACT_BELOW) return 'compact'
  if (px < MEDIUM_BELOW) return 'medium'
  if (px < EXPANDED_BELOW) return 'expanded'
  return 'wide'
}

export function heightTier(px: number): HeightTier {
  return px < SHORT_BELOW ? 'short' : 'tall'
}

export function dockOf(w: WidthTier, mainPx: number): boolean {
  return w === 'wide' && mainPx >= DOCK_MIN_MAIN
}

/**
 * The page's floor beside a docked column (§18.12, Rev .175): a detail docks
 * only while `main` keeps 760 for the page next to it. `DOCK_MIN_MAIN` is this
 * for the standard 440 column.
 */
export const PAGE_FLOOR = 760

/** The general form: wide, and `main` ≥ the column + the page floor (a 560 inspector → 1320). */
export function docksAt(w: WidthTier, mainPx: number, columnPx: number): boolean {
  return w === 'wide' && mainPx >= columnPx + PAGE_FLOOR
}

/** A `PointerEvent.pointerType` as an input mode: only a finger is touch. */
export function inputOf(pointerType: string): InputMode {
  return pointerType === 'touch' ? 'touch' : 'pointer'
}

export function isWidthTier(v: unknown): v is WidthTier {
  return v === 'compact' || v === 'medium' || v === 'expanded' || v === 'wide'
}

/**
 * `?layout=compact|medium|expanded|wide|auto` — a preview override of the width
 * class. Returns the class, `'auto'` to clear a kept override, or null when the
 * query says nothing.
 */
export function parseLayoutQuery(search: string): WidthTier | 'auto' | null {
  let v: string | null = null
  try {
    v = new URLSearchParams(search).get('layout')
  } catch {
    return null
  }
  if (v === 'auto') return 'auto'
  return isWidthTier(v) ? v : null
}

export function sameLayout(a: Layout, b: Layout): boolean {
  return a.w === b.w && a.h === b.h && a.input === b.input && a.keys === b.keys && a.dock === b.dock
}

/** Whether a change is a crossing worth announcing (`bifrost:layout`): a class, the input, or dock. */
export function crossed(a: Layout, b: Layout): boolean {
  return a.w !== b.w || a.h !== b.h || a.input !== b.input || a.dock !== b.dock
}

/**
 * The layout as written on `<html>` by a provider, for code outside React (an
 * event handler, a document listener). Null when no provider has written it.
 */
export function readLayoutAttrs(root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement): Layout | null {
  if (!root) return null
  const w = root.getAttribute('data-w')
  if (!isWidthTier(w)) return null
  return {
    w,
    h: root.getAttribute('data-h') === 'short' ? 'short' : 'tall',
    input: root.getAttribute('data-input') === 'touch' ? 'touch' : 'pointer',
    keys: root.hasAttribute('data-keys'),
    dock: root.hasAttribute('data-dock'),
  }
}

/** The band memory tier (§18.7 / §18.11): compact wins over short; short only off compact. */
export function foldTierOf(l: Pick<Layout, 'w' | 'h'>): 'compact' | 'short' | null {
  if (l.w === 'compact') return 'compact'
  if (l.h === 'short') return 'short'
  return null
}
