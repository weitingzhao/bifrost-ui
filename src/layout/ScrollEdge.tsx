/**
 * ScrollEdge (Trade design Rev .132 §16.6a): the toolbar keeps no fill and no
 * hairline; once content scrolls under it, a 60px band fades in beneath it
 * (the ground 86% → 60% with an 8px blur, masked out over its last 30%). Not
 * scrolled, there is neither line nor band.
 *
 * Place it inside the scrolling frame's positioned parent, at the toolbar's
 * lower edge (`top`), and hand it the scroller. It reads `scrollTop > 2`.
 */
import * as React from 'react'

import { cn } from '../lib/cn'

/** Whether an element has scrolled past `threshold` px. */
function useScrolledPast(ref: React.RefObject<HTMLElement | null>, threshold = 2): boolean {
  const [past, setPast] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setPast(el.scrollTop > threshold)
    read()
    el.addEventListener('scroll', read, { passive: true })
    return () => el.removeEventListener('scroll', read)
  }, [ref, threshold])
  return past
}

export function ScrollEdge({
  scrollRef,
  top = 0,
  className,
}: {
  scrollRef: React.RefObject<HTMLElement | null>
  /** The toolbar's lower edge, px from the positioned parent's top. */
  top?: number
  className?: string
}) {
  const scrolled = useScrolledPast(scrollRef)
  return (
    <div
      aria-hidden
      data-scroll-edge=""
      data-scrolled={scrolled ? 'true' : 'false'}
      className={cn('absolute inset-x-0 z-20', className)}
      style={{ top }}
    />
  )
}
