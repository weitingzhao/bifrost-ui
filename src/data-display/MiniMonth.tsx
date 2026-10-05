/**
 * MiniMonth (Trade design Rev .146 · §17.9): a small month for picking one
 * day — 7 × 6, cells 28, radius 8 — inline or in a `PopoverContent`
 * (`morphFrom` the button that opened it). Journal's day picker is the first
 * user.
 *
 * - A day may carry one status dot (`status`): `done` a solid soft dot,
 *   `pending` a hollow warn ring, none no dot.
 * - Today (or the latest day — the page decides) wears the accent 60%
 *   outline and an accent 700 number; the selected day an ink 9% fill.
 * - Weekends: drawn, dimmed and not selectable by default (`weekends="dim"`,
 *   the app's interim answer to design ASK 2026-10-04 option 3);
 *   `weekends="enabled"` makes them ordinary days.
 * - `isDisabled` takes days out (future days, days with no record).
 * - Keyboard, with the grid focused: ← → ↑ ↓ move (skipping disabled days),
 *   [ ] a month, T today, Enter / Esc `onDone` (close the popover).
 */
import * as React from 'react'

import { cn } from '../lib/cn'
import { Button } from '../ui/button'
import {
  formatDayLabel,
  formatMonthLabel,
  isoAddDays,
  isoDow,
  isoMonthOf,
  isWeekendIso,
  shiftIsoMonth,
} from '../lib/calendarDates'

export type MiniMonthStatus = 'done' | 'pending' | null | undefined

export interface MiniMonthProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** `YYYY-MM` shown. */
  month: string
  onMonthChange: (month: string) => void
  selected?: string | null
  onSelect?: (date: string) => void
  /** The accent-outlined day: today, or the latest day with a record. */
  today?: string
  status?: (date: string) => MiniMonthStatus
  /** Words for each status in a day's title, e.g. `{ done: 'distilled', pending: 'not distilled yet', none: 'nothing recorded' }`. */
  statusLabels?: { done?: string; pending?: string; none?: string }
  isDisabled?: (date: string) => boolean
  /** `dim` (default): weekend columns drawn faint and not selectable. `enabled`: ordinary days. */
  weekends?: 'dim' | 'enabled'
  /** Enter or Esc on the grid — close the popover. */
  onDone?: () => void
  /** The `‹ Month ›` row (default shown). */
  showHeader?: boolean
  /** Under the grid: a legend, `Latest`, `Calendar →`. */
  footer?: React.ReactNode
}

const DOW_LETTER = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function isTyping(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)
}

export const MiniMonth = React.forwardRef<HTMLDivElement, MiniMonthProps>(function MiniMonth(
  {
    month,
    onMonthChange,
    selected = null,
    onSelect,
    today,
    status,
    statusLabels,
    isDisabled,
    weekends = 'dim',
    onDone,
    showHeader = true,
    footer,
    className,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const off = React.useCallback(
    (d: string) => (weekends === 'dim' && isWeekendIso(d)) || !!isDisabled?.(d),
    [weekends, isDisabled],
  )

  // Monday-first weeks; a sixth row only when the month reaches it.
  const first = `${month}-01`
  const start = isoAddDays(first, -((isoDow(first) + 6) % 7))
  const rows: string[][] = []
  for (let r = 0; r < 6; r++) {
    const row = Array.from({ length: 7 }, (_, i) => isoAddDays(start, r * 7 + i))
    if (r >= 5 && isoMonthOf(row[0]) !== month) break
    rows.push(row)
  }
  const flat = rows.flat()
  const tabbable =
    (selected && flat.includes(selected) && selected) ||
    (today && flat.includes(today) && !off(today) && today) ||
    flat.find((d) => isoMonthOf(d) === month && !off(d)) ||
    flat[0]

  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const pendingFocus = React.useRef<string | null>(null)
  React.useEffect(() => {
    const want = pendingFocus.current
    if (!want || !rootRef.current) return
    const cell = rootRef.current.querySelector<HTMLElement>(`[data-date="${want}"]`)
    if (cell) {
      cell.focus()
      pendingFocus.current = null
    }
  })

  const choose = (d: string, focus: boolean) => {
    if (off(d)) return
    if (focus) pendingFocus.current = d
    onSelect?.(d)
    if (isoMonthOf(d) !== month) onMonthChange(isoMonthOf(d))
  }

  /** The next selectable day `n` days on (repeating the step past disabled days). */
  const seek = (from: string, n: number) => {
    let d = from
    for (let i = 0; i < 62; i++) {
      d = isoAddDays(d, n)
      if (!off(d)) return d
    }
    return null
  }

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
    const at = (e.target as HTMLElement).closest?.('[data-date]')?.getAttribute('data-date') ?? selected ?? tabbable
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (e.key in steps) {
      e.preventDefault()
      const d = seek(at, steps[e.key])
      if (d) choose(d, true)
    } else if (e.key === '[' || e.key === ']') {
      e.preventDefault()
      onMonthChange(shiftIsoMonth(month, e.key === '[' ? -1 : 1))
    } else if ((e.key === 't' || e.key === 'T') && today) {
      e.preventDefault()
      choose(today, true)
    } else if (e.key === 'Enter' || e.key === 'Escape') {
      if (onDone) {
        e.preventDefault()
        onDone()
      }
    }
  }

  const titleOf = (d: string) => {
    const st = status?.(d)
    const word = st === 'done' ? statusLabels?.done : st === 'pending' ? statusLabels?.pending : statusLabels?.none
    return word ? `${formatDayLabel(d)} · ${word}` : formatDayLabel(d)
  }

  return (
    <div
      ref={ref}
      data-slot="mini-month"
      className={cn('flex w-[216px] flex-col gap-2', className)}
      {...rest}
    >
      {showHeader ? (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onMonthChange(shiftIsoMonth(month, -1))}
            aria-label="Previous month"
            title="Previous month"
          >
            ‹
          </Button>
          <span className="flex-1 text-center text-[12px] font-semibold" aria-live="polite">
            {formatMonthLabel(month)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onMonthChange(shiftIsoMonth(month, 1))}
            aria-label="Next month"
            title="Next month"
          >
            ›
          </Button>
        </div>
      ) : null}
      <div
        ref={rootRef}
        role="grid"
        aria-label={ariaLabel ?? `Pick a day · ${formatMonthLabel(month)}`}
        onKeyDown={handleKey}
        className="grid justify-between gap-0.5"
        style={{ gridTemplateColumns: 'repeat(7, 28px)' }}
      >
        <div role="row" className="contents">
          {DOW_LETTER.map((l, i) => (
            <span
              key={i}
              role="columnheader"
              className={cn(
                'text-center text-[10px] font-semibold text-[var(--sk-mute,var(--muted-foreground))]',
                weekends === 'dim' && i >= 5 && 'opacity-50',
              )}
            >
              {l}
            </span>
          ))}
        </div>
        {rows.map((row, r) => (
          <div key={r} role="row" className="contents">
            {row.map((d) => {
              const inMonth = isoMonthOf(d) === month
              const disabled = off(d)
              const isToday = d === today
              const isSel = d === selected
              const st = status?.(d)
              const weekendDim = weekends === 'dim' && isWeekendIso(d)
              return (
                <div
                  key={d}
                  role="gridcell"
                  data-date={d}
                  aria-selected={isSel}
                  aria-disabled={disabled || undefined}
                  aria-label={titleOf(d)}
                  title={titleOf(d)}
                  tabIndex={d === tabbable ? 0 : -1}
                  onClick={() => choose(d, false)}
                  className={cn(
                    'flex size-7 flex-col items-center justify-center gap-px rounded-[8px] border font-mono text-[11px] tabular-nums outline-none',
                    'focus-visible:ring-2 focus-visible:ring-ring/50',
                    isToday
                      ? 'border-[color-mix(in_srgb,var(--sk-accent,var(--primary))_60%,transparent)]'
                      : 'border-transparent',
                    isSel && 'bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_9%,transparent)]',
                    disabled
                      ? 'cursor-default'
                      : cn(
                          'cursor-pointer',
                          !isSel && 'hover:bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_7%,transparent)]',
                        ),
                    isToday
                      ? 'font-bold text-[var(--sk-accent,var(--primary))]'
                      : cn(
                          isSel ? 'font-bold' : 'font-normal',
                          (status ? st : true) && !disabled
                            ? 'text-[var(--sk-ink,var(--foreground))]'
                            : 'text-[var(--sk-mute,var(--muted-foreground))]',
                        ),
                    !inMonth && 'opacity-45',
                    inMonth && weekendDim && 'opacity-40',
                  )}
                >
                  <span>{Number(d.slice(8))}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'size-1 rounded-full',
                      st === 'done' && 'bg-[var(--sk-soft,var(--foreground))]',
                      st === 'pending' && 'shadow-[inset_0_0_0_1.2px_var(--sk-warn,var(--color-lamp-yellow))]',
                    )}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {footer}
    </div>
  )
})
