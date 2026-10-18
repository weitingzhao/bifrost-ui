/**
 * Long-press = the context menu (Trade design Rev .174 B9, DESIGN_CONTRACTS
 * §18.3). On touch, a finger held 520ms with less than 8px of travel fires
 * `contextmenu` at the finger, which opens whatever `ContextMenu` (or a shell's
 * own right-click menu) listens there. The click that ends the press is eaten,
 * so the row under the finger does not also open.
 *
 * Mounted by `LayoutProvider`; inert while the input is a pointer. Drag and
 * drop is never the only way to an action: the same action has to be reachable
 * from the long-press menu.
 */
import * as React from 'react'

export const LONG_PRESS_MS = 520
export const LONG_PRESS_SLOP_PX = 8

/** Where a press never becomes a menu: fields, a sheet's grip, a sheet, the tab bar. */
const EXEMPT =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-sheet-grip], [data-slot="bottom-sheet"], [data-slot="tab-bar"]'

/** `isTouch` is read at every press: the input can change between two presses without a render. */
export function useLongPressMenu(enabled: boolean, isTouch: () => boolean): void {
  const touchRef = React.useRef(isTouch)
  touchRef.current = isTouch
  React.useEffect(() => {
    if (!enabled) return
    let lp: { x: number; y: number; fired: boolean; t: number } | null = null
    const touch = () => touchRef.current()

    const eat = (e: MouseEvent) => {
      if (!lp?.fired) return
      e.preventDefault()
      e.stopImmediatePropagation()
      lp = null
    }
    const down = (e: PointerEvent) => {
      if (!touch() || e.button !== 0 || !e.isPrimary || !(e.target instanceof Element)) return
      if (e.target.closest(EXEMPT)) return
      const target = e.target
      const x = e.clientX
      const y = e.clientY
      if (lp) window.clearTimeout(lp.t)
      lp = {
        x,
        y,
        fired: false,
        t: window.setTimeout(() => {
          if (!lp) return
          lp.fired = true
          target.dispatchEvent(
            new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }),
          )
          try {
            navigator.vibrate?.(8)
          } catch {
            // No haptics: the menu is the feedback.
          }
        }, LONG_PRESS_MS),
      }
    }
    const move = (e: PointerEvent) => {
      if (lp && !lp.fired && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > LONG_PRESS_SLOP_PX) {
        window.clearTimeout(lp.t)
        lp = null
      }
    }
    const end = () => {
      if (lp && !lp.fired) {
        window.clearTimeout(lp.t)
        lp = null
      }
    }
    // The platform's own long-press menu (iPadOS) got there first: ours stands down.
    const native = (e: MouseEvent) => {
      if (e.isTrusted && lp && !lp.fired) {
        window.clearTimeout(lp.t)
        lp.fired = true
      }
    }
    document.addEventListener('click', eat, true)
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('pointermove', move, true)
    document.addEventListener('pointerup', end, true)
    document.addEventListener('pointercancel', end, true)
    document.addEventListener('contextmenu', native, true)
    return () => {
      if (lp) window.clearTimeout(lp.t)
      document.removeEventListener('click', eat, true)
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('pointermove', move, true)
      document.removeEventListener('pointerup', end, true)
      document.removeEventListener('pointercancel', end, true)
      document.removeEventListener('contextmenu', native, true)
    }
  }, [enabled])
}
