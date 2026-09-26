import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type PageShellPadding = 'default' | 'compact' | 'none'

const paddingClass: Record<PageShellPadding, string> = {
  default: 'p-4',
  compact: 'px-3 py-2',
  none: '',
}

export interface PageShellProps {
  children: ReactNode
  padding?: PageShellPadding
  className?: string
  /**
   * Room under the last row for a floating toolbar (design Rev .73 §3): 72px
   * — the toolbar and its gap — so the page scrolls clear of it.
   */
  bottomInset?: boolean
}

export function PageShell({ children, padding = 'default', className, bottomInset = false }: PageShellProps) {
  return (
    <div
      className={cn(
        'page-shell min-h-full w-full min-w-0 bg-[var(--card)] text-[var(--card-foreground)]',
        paddingClass[padding],
        bottomInset && 'pb-[72px]',
        className,
      )}
    >
      {children}
    </div>
  )
}
