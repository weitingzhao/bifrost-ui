/**
 * The page's filter bar (design §17.3) — the `data-sr-toolbar` pattern as a
 * component. Since Rev .142 it has no slab: no fill, no frame, no radius, no
 * side padding — the controls in it carry their own material. When `sticky`,
 * it parks at the top of the scroller; since 0.10.0 (Rev .150) it has no band
 * at rest either — the ground band (86%, 8px blur, fading over its last 8px)
 * appears only while content runs under it, which the bar measures itself
 * (`useStuck` → `data-stuck="1"`). Inside, `FilterBar.Label` /
 * `FilterBar.Sep` / `FilterBar.Meta` are the pattern's label · sep · meta.
 */
import { useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { useStuck } from '../layout/stuck'

export interface FilterBarProps {
  children: ReactNode
  sticky?: boolean
  className?: string
  'aria-label'?: string
}

function FilterBarRoot({ children, sticky = false, className, 'aria-label': ariaLabel }: FilterBarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const stuck = useStuck(ref, sticky)
  return (
    <div
      ref={ref}
      data-sr-toolbar=""
      data-sticky={sticky ? '' : undefined}
      data-stuck={sticky ? (stuck ? '1' : '0') : undefined}
      role="toolbar"
      aria-label={ariaLabel}
      className={cn(className)}
    >
      {children}
    </div>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <span data-sr-tb="label">{children}</span>
}

function Sep() {
  return <span data-sr-tb="sep" aria-hidden />
}

function Meta({ children }: { children: ReactNode }) {
  return <span data-sr-tb="meta">{children}</span>
}

export const FilterBar = Object.assign(FilterBarRoot, { Label, Sep, Meta })
