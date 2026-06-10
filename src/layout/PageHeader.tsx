import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type PageHeaderTitleSize = 'default' | 'large'

export interface PageHeaderProps {
  title: ReactNode
  description?: string
  actions?: ReactNode
  breadcrumb?: ReactNode
  titleSize?: PageHeaderTitleSize
  className?: string
}

const titleSizeClass: Record<PageHeaderTitleSize, string> = {
  default: 'text-xl font-semibold tracking-tight',
  large: 'text-2xl font-semibold tracking-tight',
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  titleSize = 'default',
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <h1 className={titleSizeClass[titleSize]}>{title}</h1>
          {description != null && description !== '' && (
            <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
          )}
        </div>
        {actions != null && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}
