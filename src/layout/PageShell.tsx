import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type PageShellPadding = 'default' | 'compact' | 'none'

const paddingClass: Record<PageShellPadding, string> = {
  default: 'p-6',
  compact: 'p-4',
  none: '',
}

export interface PageShellProps {
  children: ReactNode
  padding?: PageShellPadding
  className?: string
}

export function PageShell({ children, padding = 'default', className }: PageShellProps) {
  return (
    <div
      className={cn(
        'page-shell min-h-full w-full min-w-0 bg-[var(--card)] text-[var(--card-foreground)]',
        paddingClass[padding],
        className,
      )}
    >
      {children}
    </div>
  )
}
