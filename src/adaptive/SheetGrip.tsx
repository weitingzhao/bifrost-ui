/**
 * The grip on a compact bottom sheet (Trade design Rev .174 B1, DESIGN_CONTRACTS
 * §18.5): a tap switches the two detents; a drag up past 48 goes full; a drag
 * down past 72 drops full to half and half to closed. The sheet follows the
 * finger while it drags.
 *
 * Shared by `BottomSheet` and the DS dialogs when they land as a bottom sheet
 * (`DialogContent` / `SheetContent` on compact) — one gesture for all of them.
 */
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'

/** The grip's thresholds, apart from the component so a test can read them. */
export const SHEET_DRAG_UP_PX = 48
export const SHEET_DRAG_DOWN_PX = 72

/** What a release does, by how far the finger travelled (negative = up). */
export function sheetRelease(dy: number, full: boolean): 'toggle' | 'full' | 'half' | 'close' | 'stay' {
  if (Math.abs(dy) < 4) return 'toggle'
  if (dy < -SHEET_DRAG_UP_PX) return 'full'
  if (dy > SHEET_DRAG_DOWN_PX) return full ? 'half' : 'close'
  return 'stay'
}

export interface SheetGripProps {
  sheet: RefObject<HTMLElement | null>
  full: boolean
  onDetent: (full: boolean) => void
  onClose: () => void
}

export function SheetGrip({ sheet, full, onDetent, onClose }: SheetGripProps) {
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = sheet.current
    if (!el || e.button !== 0) return
    e.preventDefault()
    const grip = e.currentTarget
    try {
      grip.setPointerCapture(e.pointerId)
    } catch {
      // A synthetic pointer: the listeners below still follow it.
    }
    const y0 = e.clientY
    let dy = 0
    const move = (ev: PointerEvent) => {
      dy = ev.clientY - y0
      el.style.translate = `0 ${Math.max(-40, dy)}px`
      el.style.transition = 'none'
    }
    const up = () => {
      grip.removeEventListener('pointermove', move)
      grip.removeEventListener('pointerup', up)
      grip.removeEventListener('pointercancel', up)
      el.style.translate = ''
      el.style.transition = ''
      const r = sheetRelease(dy, full)
      if (r === 'toggle') onDetent(!full)
      else if (r === 'full') onDetent(true)
      else if (r === 'half') onDetent(false)
      else if (r === 'close') onClose()
    }
    grip.addEventListener('pointermove', move)
    grip.addEventListener('pointerup', up)
    grip.addEventListener('pointercancel', up)
  }
  return (
    <div
      data-slot="sheet-grip"
      data-sheet-grip=""
      role="button"
      tabIndex={-1}
      aria-label={full ? 'Half height' : 'Full height'}
      onPointerDown={down}
    />
  )
}
