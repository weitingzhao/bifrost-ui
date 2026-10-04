/**
 * Stuck marks (Trade design Rev .150 · .151 · .153): a sticky element paints
 * its band only while it is actually pinned over content, never at rest.
 *
 * One measurement, three marks — the same two scripts the design registry runs
 * (`stuckHeads` and the sticky-toolbar tick), in one place so the thresholds
 * cannot drift apart:
 *
 *   data-stuck="1" | "0"   a sticky toolbar (`[data-sr-toolbar][data-sticky]`)
 *                          or any other sticky bar (`[data-sr-edge]`): its
 *                          scroller has scrolled (`scrollTop > 0`) and the bar's
 *                          top sits at the scroller's top (within 1px)
 *   thead[data-stuck]      a table head riding below its table's own top edge
 *                          (`th top − table top > 1`): sticky engaged over rows
 *   [data-sx]              a `[data-sr-hscroll]` box scrolled sideways
 *                          (`scrollLeft > 1`)
 *
 * The CSS that reads these marks lives in `styles/patterns.css`. Each mark only
 * changes how an element looks under its own opt-in attribute (the list scope
 * `[data-sr-list]`, `data-sr-edge`, a sticky toolbar), so marking costs nothing
 * elsewhere.
 *
 * - `useStuck(ref)` — a component's own sticky element (FilterBar uses it).
 * - `useStuckMarks(ref)` / `installStuckMarks(root)` — mount once per scrolling
 *   surface (the page's main, a panel body) and every hand-written bar, head and
 *   wide box under it is marked.
 */
import * as React from 'react'

/** The selector for sticky bars that take `data-stuck="1" | "0"`. */
export const STUCK_BAR_SELECTOR = '[data-sr-toolbar][data-sticky], [data-sr-edge]'

/** The nearest ancestor that scrolls vertically, else the document's scroller. */
export function findScroller(el: Element): Element | null {
  let p = el.parentElement
  while (p && p !== document.body && p !== document.documentElement) {
    const o = getComputedStyle(p).overflowY
    if (o === 'auto' || o === 'scroll' || o === 'overlay') return p
    p = p.parentElement
  }
  return document.scrollingElement
}

const px = (v: string) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * A sticky bar is stuck when its scroller has moved and the bar sits where it
 * sticks: the scroller's top, past the scroller's own top padding (a sticky
 * box parks inside it) and the bar's own `top` offset — 1px of slack for
 * sub-pixel layout. With no padding and `top: 0` this is the design
 * registry's test (bar top − scroller top ≤ 1).
 */
export function isStuck(el: Element, scroller: Element | null): boolean {
  if (!scroller || scroller.scrollTop <= 0) return false
  const isDoc = scroller === document.scrollingElement || scroller === document.documentElement
  const edge = (isDoc ? 0 : scroller.getBoundingClientRect().top) + px(getComputedStyle(scroller).paddingTop)
  return el.getBoundingClientRect().top - (edge + px(getComputedStyle(el).top)) <= 1
}

/** A table head is stuck when its first cell rides below the table's own top. */
export function isHeadStuck(thead: Element): boolean {
  const th = thead.querySelector('th')
  const table = thead.parentElement
  if (!th || !table) return false
  return th.getBoundingClientRect().top - table.getBoundingClientRect().top > 1
}

/** A wide box is scrolled sideways past 1px. */
export function isScrolledX(box: Element): boolean {
  return box.scrollLeft > 1
}

function setFlag(el: Element, name: string, on: boolean) {
  if (on === el.hasAttribute(name)) return
  if (on) el.setAttribute(name, '')
  else el.removeAttribute(name)
}

/** One pass over `root`: marks every sticky bar, table head and wide box under it. */
export function markStuck(root: ParentNode): void {
  root.querySelectorAll(STUCK_BAR_SELECTOR).forEach((el) => {
    const v = isStuck(el, findScroller(el)) ? '1' : '0'
    if (el.getAttribute('data-stuck') !== v) el.setAttribute('data-stuck', v)
  })
  root.querySelectorAll('table > thead').forEach((h) => setFlag(h, 'data-stuck', isHeadStuck(h)))
  root.querySelectorAll('[data-sr-hscroll]').forEach((b) => setFlag(b, 'data-sx', isScrolledX(b)))
}

/**
 * Re-marks on every scroll inside the document (capture phase, so nested
 * scrollers count), on resize, and a few times while a page settles. Calls are
 * folded into one per animation frame. Returns the cleanup.
 */
export function installStuckMarks(root: ParentNode): () => void {
  let raf = 0
  const run = () => {
    raf = 0
    markStuck(root)
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(run)
  }
  document.addEventListener('scroll', kick, { capture: true, passive: true })
  window.addEventListener('resize', kick)
  const timers = [0, 400, 1200].map((t) => window.setTimeout(kick, t))
  return () => {
    document.removeEventListener('scroll', kick, { capture: true })
    window.removeEventListener('resize', kick)
    timers.forEach((t) => window.clearTimeout(t))
    if (raf) cancelAnimationFrame(raf)
  }
}

/**
 * Marks everything under `ref` (a page's main, a panel body) while mounted.
 * `enabled=false` installs nothing.
 */
export function useStuckMarks(ref: React.RefObject<Element | null>, enabled = true): void {
  React.useEffect(() => {
    const root = ref.current
    if (!root || !enabled) return
    return installStuckMarks(root)
  }, [ref, enabled])
}

/**
 * Whether the sticky element in `ref` is pinned over content right now. For a
 * component that renders its own `data-stuck` (FilterBar); pages mark their
 * hand-written bars with `useStuckMarks` instead. `enabled=false` skips the
 * listeners and reads false.
 */
export function useStuck(ref: React.RefObject<Element | null>, enabled = true): boolean {
  const [stuck, setStuck] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || !enabled) {
      setStuck(false)
      return
    }
    let raf = 0
    const run = () => {
      raf = 0
      setStuck(isStuck(el, findScroller(el)))
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(run)
    }
    run()
    document.addEventListener('scroll', kick, { capture: true, passive: true })
    window.addEventListener('resize', kick)
    return () => {
      document.removeEventListener('scroll', kick, { capture: true })
      window.removeEventListener('resize', kick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, enabled])
  return stuck
}
