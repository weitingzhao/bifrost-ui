/**
 * The page's filter bar (design §17.3, Rev .73) — the `data-sr-toolbar`
 * pattern as a component: frameless, radius 12, a solid raised base; when
 * `sticky`, it parks at the top of the scroller and turns to glass so the
 * rows passing under it read through. Inside, `FilterBar.Label` /
 * `FilterBar.Sep` / `FilterBar.Meta` are the pattern's label · sep · meta.
 */
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface FilterBarProps {
  children: ReactNode
  sticky?: boolean
  className?: string
  'aria-label'?: string
}

function FilterBarRoot({ children, sticky = false, className, 'aria-label': ariaLabel }: FilterBarProps) {
  return (
    <div
      data-sr-toolbar=""
      data-sticky={sticky ? '' : undefined}
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
