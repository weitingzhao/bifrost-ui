/**
 * The bottom dock bar steps aside while you read (Trade design Rev .174 B12,
 * DESIGN_CONTRACTS §18.11). On a short screen that is not compact, scrolling
 * down the main area more than 32px in total hides the bar; 24px back up, the
 * top of the page, or a tap — or a pointer — within 56px of the bottom edge
 * brings it back. Only `main` (or the document) and what scrolls inside it count: a panel, a
 * sheet or a detail pane scrolling is not reading the page.
 *
 * The shell mounts the hook once and marks its bar `data-sr-dockbar`; the hook
 * writes `<html data-sr-dockhide>` and `styles/layout` slides the bar out
 * (220ms). It also returns the verdict for a shell that draws it itself.
 * Inert without a `LayoutProvider`.
 */
import * as React from 'react'

import { useLayoutProvided } from './LayoutProvider'

export const DOCK_HIDE_AFTER_PX = 32
export const DOCK_SHOW_AFTER_PX = 24
export const DOCK_EDGE_PX = 56

/** One scroller's step: whether the bar should now hide, show, or stay as it is. */
export function dockStep(y: number, acc: number): 'hide' | 'show' | 'stay' {
  if (y < DOCK_SHOW_AFTER_PX || acc < -DOCK_SHOW_AFTER_PX) return 'show'
  if (acc > DOCK_HIDE_AFTER_PX) return 'hide'
  return 'stay'
}

const NOT_READING = '[data-slot="detail-pane"], [data-slot="bottom-sheet"], [data-radix-popper-content-wrapper]'

export function useDockStepAside(options: { main?: string } = {}): boolean {
  const main = options.main ?? 'main'
  const layout = useLayoutProvided()
  const active = layout != null && layout.h === 'short' && layout.w !== 'compact'
  const [hidden, setHidden] = React.useState(false)

  React.useEffect(() => {
    const root = document.documentElement
    const set = (v: boolean) => {
      if (v) root.setAttribute('data-sr-dockhide', '1')
      else root.removeAttribute('data-sr-dockhide')
      setHidden(v)
    }
    if (!active) {
      set(false)
      return
    }
    const last = new WeakMap<Element, number>()
    let acc = 0
    const onScroll = (e: Event) => {
      const t = e.target instanceof Element ? e.target : document.scrollingElement
      if (!t) return
      // The document scrolling is the page too (a shell whose main does not scroll itself).
      const inMain = t === document.scrollingElement || t.matches(main) || t.closest(main) != null
      if (!inMain || t.closest(NOT_READING)) return
      const y = t.scrollTop
      const p = last.get(t) ?? y
      last.set(t, y)
      const d = y - p
      acc = d > 0 === acc > 0 ? acc + d : d
      const step = dockStep(y, acc)
      if (step === 'show') set(false)
      else if (step === 'hide') set(true)
    }
    const nearEdge = (e: PointerEvent) => e.clientY > window.innerHeight - DOCK_EDGE_PX
    const onDown = (e: PointerEvent) => {
      if (root.hasAttribute('data-sr-dockhide') && nearEdge(e)) {
        acc = 0
        set(false)
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && root.hasAttribute('data-sr-dockhide') && nearEdge(e)) {
        acc = 0
        set(false)
      }
    }
    document.addEventListener('scroll', onScroll, true)
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('pointermove', onMove, true)
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('pointermove', onMove, true)
      root.removeAttribute('data-sr-dockhide')
    }
  }, [active, main])

  return active && hidden
}
