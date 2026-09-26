import type { ComponentProps, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn'

export type CollapsibleGroupVariant = 'card' | 'inset'

/** card = the card material, inset = a rule inside its group (1a, 0.5.1). */
const shellByVariant: Record<CollapsibleGroupVariant, string> = {
  card: 'mb-2 overflow-hidden rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-fill)]',
  inset: 'border-t border-[var(--table-rule)]',
}

export function CollapsibleGroup({
  variant = 'card',
  className,
  children,
}: {
  variant?: CollapsibleGroupVariant
  className?: string
  children: ReactNode
}) {
  return <div className={cn(shellByVariant[variant], className)}>{children}</div>
}

export function CollapsibleChevron({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <ChevronDown
      className={cn(
        'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
        expanded && 'rotate-180',
        className,
      )}
      aria-hidden
    />
  )
}

export function CollapsibleGroupHeader({
  expanded,
  onToggle,
  className,
  children,
  ...rest
}: {
  expanded: boolean
  onToggle: () => void
  className?: string
  children: ReactNode
} & Omit<ComponentProps<'button'>, 'onClick' | 'children'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left text-dense-body text-foreground',
        // No header band: the row is part of the group; hover lays one more ink step on it.
        'transition-colors hover:bg-[var(--card-fill)]',
        className,
      )}
      onClick={onToggle}
      aria-expanded={expanded}
      {...rest}
    >
      {children}
    </button>
  )
}

export function CollapsibleGroupTitle({
  children,
  className,
  wrap = false,
}: {
  children: ReactNode
  className?: string
  wrap?: boolean
}) {
  return (
    <span
      className={cn(
        'min-w-0 font-semibold',
        wrap
          ? 'whitespace-normal break-words [overflow-wrap:anywhere]'
          : 'truncate',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function CollapsibleGroupStats({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'ml-auto flex shrink-0 flex-wrap gap-x-3 gap-y-0.5 text-dense-meta text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function CollapsibleGroupBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('px-2 pb-2', className)}>{children}</div>
}

export function CollapsibleBucketHeader({
  expanded,
  onToggle,
  label,
  count,
  className,
}: {
  expanded: boolean
  onToggle: () => void
  label: ReactNode
  count?: number
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        'mb-1 mt-3 flex items-baseline gap-1.5 text-dense-body font-semibold text-foreground',
        className,
      )}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <CollapsibleChevron expanded={expanded} className="self-center" />
      {label}
      {count != null ? (
        <span className="text-[0.92em] font-medium text-muted-foreground">({count})</span>
      ) : null}
    </button>
  )
}
