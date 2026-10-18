/**
 * `LayoutProvider` + `useLayout()` (Trade design Rev .174 A1, DESIGN_CONTRACTS
 * §18.1 · §18.3 · §18.12) — the one place that measures; everything else reads.
 *
 * The provider keeps `{ w, h, input, keys, dock }` current and writes it on
 * `<html>` as `data-w` · `data-h` · `data-input` · `data-keys` · `data-dock`
 * (plus `data-safe` when the screen has safe-area insets), which is all
 * `styles/layout.css` and the pages ever read. When a class, the input or the
 * dock verdict changes it fires `bifrost:layout` on `window`.
 *
 * - width / height: the window's (`resize`, `orientationchange`);
 * - input: the last `pointerdown`'s `pointerType` (a mouse hovering with no
 *   button down also counts as pointer — a trackpad on an iPad);
 * - keys: a `keydown` outside a text field (or with ⌘ / Ctrl inside one);
 * - dock: a ResizeObserver on `main` — the content area right of the sidebar,
 *   docked column included, never the scroller inside it (Rev .170: measuring
 *   the scroller made a docked column flip dock off, re-grow, and oscillate).
 *
 * `?layout=compact|medium|expanded|wide` pins the width class for the tab's
 * session (a preview); `?layout=auto` lets go. `override` pins axes from code.
 *
 * **Opt-in.** Every DS component that adapts reads `useLayoutProvided()`:
 * with no provider above it, it behaves exactly as it did in 0.14.0. One
 * provider per document, at the app's root.
 */
import * as React from 'react'

import {
  DEFAULT_LAYOUT,
  LAYOUT_EVENT,
  crossed,
  dockOf,
  docksAt,
  heightTier,
  inputOf,
  isWidthTier,
  parseLayoutQuery,
  sameLayout,
  widthTier,
  type InputMode,
  type Layout,
  type WidthTier,
} from './layout'
import { useLongPressMenu } from './longPress'

const LayoutContext = React.createContext<Layout | null>(null)

/** The layout now. With no provider above, a desktop with a mouse (`DEFAULT_LAYOUT`). */
export function useLayout(): Layout {
  return React.useContext(LayoutContext) ?? DEFAULT_LAYOUT
}

/** The layout, or null with no provider — how DS components keep their 0.14.0 behaviour outside one. */
export function useLayoutProvided(): Layout | null {
  return React.useContext(LayoutContext)
}

/** `main`'s width, outside the layout state: it moves by the pixel, the classes do not. */
interface MainWidth {
  get: () => number
  set: (px: number) => void
  subscribe: (fn: () => void) => () => void
}

function mainWidthStore(): MainWidth {
  let px = 0
  const fns = new Set<() => void>()
  return {
    get: () => px,
    set: (next) => {
      if (next === px) return
      px = next
      fns.forEach((fn) => fn())
    },
    subscribe: (fn) => {
      fns.add(fn)
      return () => fns.delete(fn)
    },
  }
}

const MainWidthContext = React.createContext<MainWidth | null>(null)
const NO_STORE = () => () => {}

/**
 * Whether a column `columnPx` wide docks beside the page (§18.12 general form,
 * Rev .175): wide, and `main` ≥ the column + 760. Re-renders only when the
 * verdict flips. With no provider, false — the column floats.
 */
export function useDocksAt(columnPx: number): boolean {
  const layout = useLayoutProvided()
  const store = React.useContext(MainWidthContext)
  const w = layout?.w
  return React.useSyncExternalStore(
    store ? store.subscribe : NO_STORE,
    () => store != null && w != null && docksAt(w, store.get(), columnPx),
    () => false,
  )
}

export interface LayoutProviderProps {
  children?: React.ReactNode
  /** The content area measured for `dock`. A selector; `main` by default. */
  main?: string
  /** Pin axes (a variant page, a test): they win over measurement and `?layout=`. */
  override?: Partial<Pick<Layout, 'w' | 'h' | 'input'>>
  /** Long-press (520ms, < 8px) opens the context menu on touch (§18.3). On by default. */
  longPress?: boolean
}

const SESSION_KEY = 'bifrost.layout'
const ATTRS = ['data-w', 'data-h', 'data-input', 'data-keys', 'data-dock', 'data-safe'] as const
const TEXT_FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

function keptWidth(): WidthTier | null {
  if (typeof window === 'undefined') return null
  let store: Storage | null = null
  try {
    store = window.sessionStorage
  } catch {
    store = null
  }
  const q = parseLayoutQuery(window.location.search)
  try {
    if (q === 'auto') store?.removeItem(SESSION_KEY)
    else if (q) store?.setItem(SESSION_KEY, q)
    const kept = store?.getItem(SESSION_KEY) ?? null
    return isWidthTier(kept) ? kept : q && q !== 'auto' ? q : null
  } catch {
    return q && q !== 'auto' ? q : null
  }
}

function coarse(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches
  } catch {
    return false
  }
}

let safeProbe: boolean | null = null
/** Whether the screen has a safe area (notch, home indicator). Measured once per orientation. */
function hasSafeArea(fresh: boolean): boolean {
  if (safeProbe != null && !fresh) return safeProbe
  if (typeof document === 'undefined' || !document.body) return false
  const p = document.createElement('div')
  p.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'
  document.body.appendChild(p)
  const c = getComputedStyle(p)
  safeProbe = [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft].some((v) => parseFloat(v) > 0)
  p.remove()
  return safeProbe
}

function writeAttrs(l: Layout, safe: boolean): void {
  const root = document.documentElement
  root.setAttribute('data-w', l.w)
  root.setAttribute('data-h', l.h)
  root.setAttribute('data-input', l.input)
  if (l.keys) root.setAttribute('data-keys', '1')
  else root.removeAttribute('data-keys')
  if (l.dock) root.setAttribute('data-dock', '1')
  else root.removeAttribute('data-dock')
  if (safe) root.setAttribute('data-safe', '1')
  else root.removeAttribute('data-safe')
}

export function LayoutProvider({ children, main = 'main', override, longPress = true }: LayoutProviderProps) {
  const forcedW = React.useRef<WidthTier | null>(null)
  const input = React.useRef<InputMode>('pointer')
  const keys = React.useRef(false)
  const mainEl = React.useRef<Element | null>(null)
  const mainPx = React.useRef(0)
  const [mainWidth] = React.useState(mainWidthStore)
  const overrideRef = React.useRef(override)
  overrideRef.current = override

  const compute = React.useCallback((): Layout => {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT
    const o = overrideRef.current
    const w = o?.w ?? forcedW.current ?? widthTier(window.innerWidth)
    const m = mainEl.current && mainEl.current.isConnected ? mainEl.current.clientWidth : window.innerWidth
    mainPx.current = m
    return {
      w,
      h: o?.h ?? heightTier(window.innerHeight),
      input: o?.input ?? input.current,
      keys: keys.current,
      dock: dockOf(w, m),
    }
  }, [])

  const [layout, setLayout] = React.useState<Layout>(() => {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT
    forcedW.current = keptWidth()
    input.current = coarse() ? 'touch' : 'pointer'
    return compute()
  })

  // `<html>` follows the state; a crossing is announced after the attributes land.
  const announced = React.useRef<Layout | null>(null)

  /** Re-measure. `silent`: the first measurement of `main` after mount is not a crossing. */
  const refresh = React.useCallback(
    (silent = false) => {
      const next = compute()
      if (silent && announced.current) announced.current = next
      setLayout((prev) => (sameLayout(prev, next) ? prev : next))
      mainWidth.set(mainPx.current)
    },
    [compute, mainWidth],
  )
  React.useLayoutEffect(() => {
    writeAttrs(layout, hasSafeArea(false))
    const was = announced.current
    announced.current = layout
    if (was && crossed(was, layout)) {
      window.dispatchEvent(new CustomEvent(LAYOUT_EVENT, { detail: { ...layout } }))
    }
  }, [layout])

  // An override that changes from code is a crossing like any other.
  const ow = override?.w
  const oh = override?.h
  const oi = override?.input
  React.useLayoutEffect(() => {
    refresh()
  }, [ow, oh, oi, refresh])

  // Unmount: the document goes back to having no layout on it.
  React.useLayoutEffect(
    () => () => {
      const root = document.documentElement
      for (const a of ATTRS) root.removeAttribute(a)
      announced.current = null
    },
    [],
  )

  React.useLayoutEffect(() => {
    let ro: ResizeObserver | null = null
    const bind = (silent = false) => {
      const el = document.querySelector(main)
      // Unchanged (still the same connected node, or still none): nothing to re-measure.
      if (el === mainEl.current && (el == null || el.isConnected)) return
      ro?.disconnect()
      mainEl.current = el
      if (el && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => refresh())
        ro.observe(el)
      }
      refresh(silent)
    }
    bind(true)
    // `main` may mount after the provider, or be replaced (a remounted shell).
    const mo = new MutationObserver(() => {
      if (!mainEl.current || !mainEl.current.isConnected) bind()
    })
    mo.observe(document.body, { childList: true, subtree: true })

    const onResize = () => refresh()
    const onOrient = () => {
      hasSafeArea(true)
      refresh()
    }
    const onDown = (e: PointerEvent) => {
      const next = inputOf(e.pointerType)
      if (next === input.current) return
      input.current = next
      refresh()
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.buttons !== 0 || input.current === 'pointer') return
      input.current = 'pointer'
      refresh()
    }
    const onKey = (e: KeyboardEvent) => {
      if (keys.current || e.isComposing) return
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest(TEXT_FIELD) && !e.metaKey && !e.ctrlKey) return
      keys.current = true
      refresh()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrient)
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('pointermove', onMove, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      ro?.disconnect()
      mo.disconnect()
      mainEl.current = null
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrient)
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('pointermove', onMove, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [main, refresh])

  useLongPressMenu(longPress, () => (overrideRef.current?.input ?? input.current) === 'touch')

  return (
    <LayoutContext.Provider value={layout}>
      <MainWidthContext.Provider value={mainWidth}>{children}</MainWidthContext.Provider>
    </LayoutContext.Provider>
  )
}
