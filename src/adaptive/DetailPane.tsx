/**
 * One detail, three places (Trade design Rev .174 B3, DESIGN_CONTRACTS §18.12,
 * Rev .165–.170):
 *
 * - **dock** (`wide` and `main` ≥ 1200) — a standing column beside the list,
 *   `--detail-w` (440) wide, in place (`position: relative`), no drop shadow.
 *   A row click swaps its content; nothing floats.
 * - **not dock** (medium · expanded · wide on a narrow `main`) — an overlay on
 *   the right of its parent (`position: absolute`), on the opaque page ground
 *   (`--background`) with `--glass-drop`.
 * - **compact** — a `BottomSheet`.
 *
 * The parent must be `position: relative`, and the pane must be a **sibling**
 * of the scrolling list, never inside it (inside, the overlay scrolls away
 * with the rows).
 *
 * Crossing a class keeps the content and its scroll: the children render once,
 * into one node that moves between the column and the sheet — they are never
 * unmounted and mounted again, so a form keeps its typing and a query its data.
 *
 * With no `LayoutProvider` above it, the pane is the overlay (nothing measured
 * `main`, so it never asks the page for a column). The look is in
 * `@bifrost/ui/styles/layout`.
 */
import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../lib/cn'
import { BottomSheet } from './BottomSheet'
import { useLayout } from './LayoutProvider'

export type DetailPanePlace = 'dock' | 'overlay' | 'sheet'

export interface DetailPaneProps {
  open: boolean
  onClose: () => void
  /** The column / overlay width; `var(--detail-w)` (440) when unset. A number is px. */
  width?: number | string
  /** `edit` makes the compact sheet opaque (the overlay is always opaque). */
  material?: 'view' | 'edit'
  /** The compact sheet's head. Unset, the sheet has no head: the content carries its own. */
  title?: React.ReactNode
  /** The compact sheet's accessible name when `title` is not plain text. */
  label?: string
  className?: string
  children?: React.ReactNode
}

export function DetailPane({ open, onClose, width, material = 'view', title, label, className, children }: DetailPaneProps) {
  const layout = useLayout()
  const place: DetailPanePlace = layout.w === 'compact' ? 'sheet' : layout.dock ? 'dock' : 'overlay'
  // The one node the children live in, for the pane's whole life.
  const [host] = React.useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.setAttribute('data-slot', 'detail-pane-body')
    return el
  })
  const pane = React.useRef<HTMLElement>(null)
  const [slot, setSlot] = React.useState<HTMLDivElement | null>(null)
  const scrolled = React.useRef(0)

  React.useEffect(() => {
    if (!host) return
    const onScroll = () => {
      scrolled.current = host.scrollTop
    }
    host.addEventListener('scroll', onScroll, { passive: true })
    return () => host.removeEventListener('scroll', onScroll)
  }, [host])

  // Move the node to where the detail is shown now; a detached node loses its
  // scroll offset, so put it back.
  React.useLayoutEffect(() => {
    const target = place === 'sheet' ? slot : pane.current
    if (!host || !target || host.parentElement === target) return
    target.appendChild(host)
    host.scrollTop = scrolled.current
  }, [place, slot, host, open])

  const style =
    width == null
      ? undefined
      : ({ '--detail-pane-w': typeof width === 'number' ? `${width}px` : width } as React.CSSProperties)

  return (
    <>
      <aside
        ref={pane}
        data-slot="detail-pane"
        data-place={place}
        data-material={material}
        hidden={!open || place === 'sheet'}
        className={cn(className)}
        style={style}
      />
      {place === 'sheet' ? (
        <BottomSheet
          open={open}
          onOpenChange={(next) => {
            if (!next) onClose()
          }}
          title={title}
          head={title != null ? undefined : false}
          label={label ?? (typeof title === 'string' ? title : 'Detail')}
          material={material}
          flush
        >
          <div ref={setSlot} data-slot="detail-pane-slot" />
        </BottomSheet>
      ) : null}
      {host ? createPortal(children, host) : null}
    </>
  )
}
