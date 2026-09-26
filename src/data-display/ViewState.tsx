import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../lib/cn'
import { EmptyState } from './EmptyState'
import { HealthLamp } from './HealthLamp'

/**
 * Every non-ready state a data region can be in (design `_Part State`,
 * DESIGN_CONTRACTS §17.1). The page decides which; this only renders it.
 *
 * | kind        | when                                  | action        |
 * |-------------|---------------------------------------|---------------|
 * | `loading`   | first load — skeleton, only after 300ms | —           |
 * | `failed`    | the read failed and there is no copy  | Retry         |
 * | `stale`     | a refresh failed; the last copy stays | Retry         |
 * | `empty`     | the query holds and returns nothing   | the page's    |
 * | `filtered`  | the filters emptied the list          | Clear filters |
 * | `signedout` | no credentials (§14.1)                | Set user      |
 * | `notwired`  | designed, the feed is not wired       | —             |
 *
 * Only `failed` (red) and `stale` (amber) carry a colour; everything else is
 * grey, because a missing reading is never a fault (§11.3.1). `stale` is always
 * a strip laid over data that is still shown; any other kind can be a strip
 * too, but defaults to a block that replaces the region.
 */

export type ViewStateKind = 'loading' | 'failed' | 'stale' | 'empty' | 'filtered' | 'signedout' | 'notwired'

const KINDS: Record<ViewStateKind, { lamp: 'red' | 'yellow' | 'gray'; title: string; action: string }> = {
  loading: { lamp: 'gray', title: 'Loading', action: '' },
  failed: { lamp: 'red', title: 'Couldn’t load', action: 'Retry' },
  stale: { lamp: 'yellow', title: 'Couldn’t refresh', action: 'Retry' },
  empty: { lamp: 'gray', title: 'Nothing here yet', action: '' },
  filtered: { lamp: 'gray', title: 'No rows match these filters', action: 'Clear filters' },
  signedout: { lamp: 'gray', title: 'Research user not set', action: 'Set user' },
  notwired: { lamp: 'gray', title: 'Not wired yet', action: '' },
}

/** Skeleton cell widths, the design's own, so a skeleton reads like a table. */
const WIDTHS = ['28%', '12%', '10%', '14%', '9%', '11%', '8%', '10%']

export interface ViewStateProps {
  kind: ViewStateKind
  /** Say which thing it is — `Couldn't load the limit book`, not `Error`. */
  title?: string
  /** The reason and the time; for `failed`, that nothing below was evaluated. */
  detail?: string
  layout?: 'block' | 'strip'
  actionLabel?: string
  actionTitle?: string
  onAction?: () => void
  /** Skeleton shape for `loading`. */
  rows?: number
  cols?: number
  className?: string
}

export function ViewState({
  kind,
  title,
  detail,
  layout,
  actionLabel,
  actionTitle,
  onAction,
  rows = 4,
  cols = 4,
  className,
}: ViewStateProps) {
  const k = KINDS[kind]
  const heading = title?.trim() || k.title
  const label = actionLabel?.trim() || k.action
  const hasAction = label !== '' && onAction != null
  const strip = kind === 'stale' || (kind !== 'loading' && layout === 'strip')
  const tone =
    kind === 'failed'
      ? 'text-[color-mix(in_srgb,var(--color-lamp-red)_55%,var(--foreground))]'
      : kind === 'stale'
        ? 'text-[color-mix(in_srgb,var(--color-lamp-yellow)_70%,var(--foreground))]'
        : 'text-muted-foreground'

  // Loading shows only after 300ms, so a fast answer never flashes a skeleton.
  const [late, setLate] = useState(false)
  useEffect(() => {
    if (kind !== 'loading') return
    setLate(false)
    const t = setTimeout(() => setLate(true), 300)
    return () => clearTimeout(t)
  }, [kind])

  const role = kind === 'failed' || kind === 'stale' ? 'alert' : 'status'
  const button = hasAction ? (
    <Button
      type="button"
      variant={kind === 'failed' ? 'default' : 'outline'}
      size="sm"
      onClick={onAction}
      title={actionTitle || label}
    >
      {label}
    </Button>
  ) : null

  if (kind === 'loading') {
    const r = Math.max(1, Math.min(12, rows))
    const c = Math.max(1, Math.min(8, cols))
    return (
      <div
        role={role}
        aria-busy="true"
        aria-live="polite"
        data-sr-state={kind}
        className={cn('flex min-w-0 flex-col gap-3 p-3 transition-opacity duration-200', late ? 'opacity-100' : 'opacity-0', className)}
      >
        <span className="sr-only">{heading}</span>
        {Array.from({ length: r }, (_, i) => (
          <div key={i} className="flex min-w-0 items-center gap-4">
            {Array.from({ length: c }, (_, j) => (
              <Skeleton key={j} className="h-2.5 flex-none" style={{ width: j === 0 ? WIDTHS[0] : WIDTHS[(j + i) % WIDTHS.length] }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (strip) {
    return (
      <div
        role={role}
        aria-live="polite"
        data-sr-state={kind}
        className={cn(
          'flex min-h-8 min-w-0 items-center gap-2 rounded-[var(--card-radius)] border py-1 pl-3 pr-1.5 text-xs',
          kind === 'stale'
            ? 'border-[color-mix(in_srgb,var(--color-lamp-yellow)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-lamp-yellow)_7%,transparent)]'
            : 'border-[var(--card-border)] bg-[var(--card-fill)]',
          className,
        )}
      >
        <HealthLamp lamp={k.lamp} variant="dot" title={kind} />
        <span className={cn('whitespace-nowrap font-semibold', tone)}>{heading}</span>
        {detail ? (
          <span title={detail} className="min-w-0 truncate text-[var(--sk-mute2,var(--muted-foreground))]">
            {detail}
          </span>
        ) : null}
        <span className="flex-[1_1_auto]" />
        {button}
      </div>
    )
  }

  return (
    <div role={role} aria-live="polite" data-sr-state={kind} className={cn('min-w-0 p-3', className)}>
      <EmptyState
        icon={<HealthLamp lamp={k.lamp} variant="dot" title={kind} />}
        title={heading}
        titleClassName={kind === 'failed' ? tone : undefined}
        description={detail}
        action={button}
      />
    </div>
  )
}
