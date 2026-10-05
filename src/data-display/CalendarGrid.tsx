/**
 * CalendarGrid (Trade design Rev .146 · DESIGN_CONTRACTS §17.9): the month
 * calendar's frame and behaviour, never its content. One rule set for every
 * month grid (Home › Calendar, Performance):
 *
 * - Trading days: Monday first, weekdays only; a weekend column appears when
 *   something in view is dated on it (`hasContent`), when it holds today
 *   (Owner #19: a weekend today gets its column) or the selected day.
 * - Today: accent 60% outline, no fill, the number in accent 700 with `today`.
 * - Selected: ink 9% fill, no outline; hover ink 7%. Today selected = both.
 * - Before today the number is mute2, from today ink; days outside the month 45%.
 * - A closed market writes `<holiday> · market closed` in grey and draws no
 *   content; an early close writes `early close` and keeps its content.
 * - State colour (a breached margin on that day) is the cell's edge only
 *   (`cellTone`), never its text.
 * - Keyboard, with the grid focused: ← → a day · ↑ ↓ a week · T today ·
 *   [ ] a month · Enter opens the day (`onOpen`). Text fields keep their keys.
 *
 * What a cell says — and whether today shows the past layers, the coming ones
 * or both — is the page's: `renderCell` and `renderCorner` get the day's
 * context (`tense` is `past` · `today` · `future`). The grid fetches nothing
 * and holds no data; holidays come in as a prop from the trading calendar.
 */
import * as React from 'react'

import { cn } from '../lib/cn'
import { Button } from '../ui/button'
import {
  DOW_SHORT,
  formatDayLabel,
  isoAddDays,
  isoDow,
  isoMonthOf,
  shiftIsoMonth,
} from '../lib/calendarDates'

export interface CalendarHoliday {
  label: string
  /** `closed` (default): the market is shut — the cell draws no content. `early`: a half day. */
  kind?: 'closed' | 'early'
}

export type CalendarTense = 'past' | 'today' | 'future'

export interface CalendarDayContext {
  date: string
  /** In the shown month (always true in the week span). */
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  /** Relative to `today`. Today is its own tense: a page decides what today shows. */
  tense: CalendarTense
  weekend: boolean
  holiday: CalendarHoliday | null
}

export interface CalendarGridProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** `YYYY-MM` — the month shown (`span="month"`). */
  month: string
  /** `month` (default) — the weeks of `month`; `week` — the week of the selected day (or today), tall cells. */
  span?: 'month' | 'week'
  /** `YYYY-MM-DD` — the caller's today (New York, Chicago …). */
  today: string
  selected?: string | null
  onSelect?: (date: string) => void
  /** Asked for when the selection moves into another month, and on `[` / `]`. */
  onMonthChange?: (month: string) => void
  /** Enter or a double click: open the day (§17.9 #8 — beside the grid, not a third float). */
  onOpen?: (date: string) => void
  /** Default true. False draws all seven columns. */
  weekdaysOnly?: boolean
  /** Default `mon` (§17.9). */
  weekStart?: 'mon' | 'sun'
  /** Whether something is dated on a day — only consulted for weekend days. */
  hasContent?: (date: string) => boolean
  /** Market closures and half days by date, from the trading calendar. A string is a closed day's name. */
  holidays?: Readonly<Record<string, string | CalendarHoliday>>
  /** The cell's body (§17.9: the page decides). Not called on a closed day, nor outside the month unless `outsideContent`. */
  renderCell?: (ctx: CalendarDayContext) => React.ReactNode
  /** The cell's top-right reading, e.g. the day's net P&L. */
  renderCorner?: (ctx: CalendarDayContext) => React.ReactNode
  /** A state colour for the cell's edge. */
  cellTone?: (ctx: CalendarDayContext) => 'warn' | 'danger' | null | undefined
  /** Extra words for the cell's accessible name (`4 fills · +$420`). */
  cellLabel?: (ctx: CalendarDayContext) => string | null | undefined
  /** Default 104 for a month (§17.9: ≥ 96), 320 for a week. */
  cellMinHeight?: number
  /** Call `renderCell` for the neighbouring months' days too (default false). */
  outsideContent?: boolean
}

const MON_FIRST = [1, 2, 3, 4, 5, 6, 0]
const SUN_FIRST = [0, 1, 2, 3, 4, 5, 6]

function holidayOf(h: string | CalendarHoliday | undefined): CalendarHoliday | null {
  if (!h) return null
  return typeof h === 'string' ? { label: h, kind: 'closed' } : { kind: 'closed', ...h }
}

/** The grey line a closure writes in its cell. */
export function holidayLine(h: CalendarHoliday): string {
  if (h.kind === 'early') return h.label ? `${h.label} · early close` : 'early close'
  return `${h.label} · market closed`
}

function isTyping(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)
}

export const CalendarGrid = React.forwardRef<HTMLDivElement, CalendarGridProps>(function CalendarGrid(
  {
    month,
    span = 'month',
    today,
    selected = null,
    onSelect,
    onMonthChange,
    onOpen,
    weekdaysOnly = true,
    weekStart = 'mon',
    hasContent,
    holidays,
    renderCell,
    renderCorner,
    cellTone,
    cellLabel,
    cellMinHeight,
    outsideContent = false,
    className,
    style,
    onKeyDown,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const order = weekStart === 'sun' ? SUN_FIRST : MON_FIRST
  const anchor = selected ?? today

  // The days in view, as weeks of seven.
  const weeks = React.useMemo(() => {
    const startOfWeek = (d: string) => isoAddDays(d, -((isoDow(d) - order[0] + 7) % 7))
    if (span === 'week') {
      const s = startOfWeek(anchor)
      return [Array.from({ length: 7 }, (_, i) => isoAddDays(s, i))]
    }
    const first = `${month}-01`
    const out: string[][] = []
    let cur = startOfWeek(first)
    while (isoMonthOf(cur) <= month && out.length < 6) {
      out.push(Array.from({ length: 7 }, (_, i) => isoAddDays(cur, i)))
      cur = isoAddDays(cur, 7)
    }
    return out
  }, [span, anchor, month, order])

  // Which days of the week are columns (§17.9 #1, Owner #19).
  const shownDows = React.useMemo(() => {
    const set = new Set<number>(weekdaysOnly ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6])
    if (weekdaysOnly) {
      for (const week of weeks)
        for (const d of week) {
          const w = isoDow(d)
          if (w !== 0 && w !== 6) continue
          const inView = span === 'week' || isoMonthOf(d) === month
          if (inView && (d === today || d === selected || hasContent?.(d))) set.add(w)
        }
    }
    return order.filter((w) => set.has(w))
  }, [weeks, weekdaysOnly, today, selected, hasContent, order, span, month])

  const visible = React.useCallback((d: string) => shownDows.includes(isoDow(d)), [shownDows])
  const rows = weeks.map((w) => w.filter(visible))
  const flat = rows.flat()
  const tabbable = flat.includes(anchor)
    ? anchor
    : (flat.find((d) => span === 'week' || isoMonthOf(d) === month) ?? flat[0])

  // Keyboard moves land focus on the new day once it is rendered.
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
    if (focus) pendingFocus.current = d
    onSelect?.(d)
    if (span === 'month' && isoMonthOf(d) !== month) onMonthChange?.(isoMonthOf(d))
    else if (span === 'week' && isoMonthOf(d) !== isoMonthOf(anchor)) onMonthChange?.(isoMonthOf(d))
  }

  const step = (from: string, dir: 1 | -1) => {
    let d = from
    for (let i = 0; i < 7; i++) {
      d = isoAddDays(d, dir)
      if (visible(d)) return d
    }
    return isoAddDays(from, dir)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
    const at = (e.target as HTMLElement).closest?.('[data-date]')?.getAttribute('data-date') ?? anchor
    let next: string | null = null
    switch (e.key) {
      case 'ArrowLeft':
        next = step(at, -1)
        break
      case 'ArrowRight':
        next = step(at, 1)
        break
      case 'ArrowUp':
        next = isoAddDays(at, -7)
        break
      case 'ArrowDown':
        next = isoAddDays(at, 7)
        break
      case 't':
      case 'T':
        next = today
        break
      case '[':
      case ']': {
        const dir = e.key === '[' ? -1 : 1
        e.preventDefault()
        if (span === 'week') {
          choose(isoAddDays(at, 7 * dir), true)
        } else {
          onMonthChange?.(shiftIsoMonth(month, dir))
        }
        return
      }
      case 'Enter':
        e.preventDefault()
        if (onOpen) onOpen(at)
        else onSelect?.(at)
        return
      default:
        return
    }
    e.preventDefault()
    if (next) choose(next, true)
  }

  const minH = cellMinHeight ?? (span === 'week' ? 320 : 104)

  const cell = (date: string) => {
    const inMonth = span === 'week' || isoMonthOf(date) === month
    const isToday = date === today
    const isSelected = date === selected
    const w = isoDow(date)
    const holiday = holidayOf(holidays?.[date])
    const ctx: CalendarDayContext = {
      date,
      inMonth,
      isToday,
      isSelected,
      tense: isToday ? 'today' : date < today ? 'past' : 'future',
      weekend: w === 0 || w === 6,
      holiday,
    }
    const tone = cellTone?.(ctx) ?? null
    const closed = holiday?.kind !== 'early' && holiday != null
    const body = closed || (!inMonth && !outsideContent) ? null : renderCell?.(ctx)
    const corner = inMonth || outsideContent ? renderCorner?.(ctx) : null
    const extra = cellLabel?.(ctx)
    const name = [formatDayLabel(date), isToday ? 'today' : null, holiday ? holidayLine(holiday) : null, extra || null]
      .filter(Boolean)
      .join(', ')
    return (
      <div
        key={date}
        role="gridcell"
        aria-selected={isSelected}
        aria-label={name}
        tabIndex={date === tabbable ? 0 : -1}
        data-date={date}
        data-today={isToday || undefined}
        data-selected={isSelected || undefined}
        data-outside={!inMonth || undefined}
        data-tense={ctx.tense}
        data-weekend={ctx.weekend || undefined}
        data-holiday={holiday ? holiday.kind : undefined}
        data-tone={tone ?? undefined}
        onClick={() => choose(date, false)}
        onDoubleClick={onOpen ? () => onOpen(date) : undefined}
        style={{ minHeight: minH }}
        className={cn(
          'flex min-w-0 cursor-pointer flex-col gap-0.5 rounded-[10px] border px-2 pt-1.5 pb-[7px] outline-none transition-colors',
          'focus-visible:ring-2 focus-visible:ring-ring/50',
          isToday
            ? 'border-[color-mix(in_srgb,var(--sk-accent,var(--primary))_60%,transparent)]'
            : 'border-transparent',
          isSelected
            ? 'bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_9%,transparent)]'
            : 'bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_3.5%,transparent)] hover:bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_7%,transparent)]',
          tone === 'warn' && 'shadow-[inset_0_0_0_1px_var(--sk-warn,var(--color-lamp-yellow))]',
          tone === 'danger' && 'shadow-[inset_0_0_0_1px_var(--color-lamp-red)]',
          !inMonth && 'opacity-45',
        )}
      >
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span
            className={cn(
              span === 'week' ? 'text-[12px] font-semibold' : 'font-mono text-[12px] tabular-nums',
              isToday
                ? 'font-bold text-[var(--sk-accent,var(--primary))]'
                : cn(
                    span === 'week' ? null : 'font-medium',
                    !inMonth
                      ? 'text-[var(--sk-mute,var(--muted-foreground))]'
                      : date < today
                        ? 'text-[var(--sk-mute2,var(--muted-foreground))]'
                        : 'text-[var(--sk-ink,var(--foreground))]',
                  ),
            )}
          >
            {span === 'week' ? formatDayLabel(date) : String(Number(date.slice(8)))}
          </span>
          {isToday ? (
            <span className="text-[10px] font-semibold text-[var(--sk-accent,var(--primary))]">today</span>
          ) : null}
          {corner != null && corner !== false ? (
            <span className="ml-auto min-w-0 truncate font-mono text-[11px] font-semibold tabular-nums">{corner}</span>
          ) : null}
        </div>
        {holiday && inMonth ? (
          <span className="truncate text-[11px] leading-4 text-[var(--sk-mute,var(--muted-foreground))]">
            {holidayLine(holiday)}
          </span>
        ) : null}
        {body}
      </div>
    )
  }

  return (
    <div
      ref={(el) => {
        rootRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      }}
      role="grid"
      aria-label={ariaLabel ?? 'Calendar'}
      data-slot="calendar-grid"
      data-span={span}
      onKeyDown={handleKey}
      className={cn('grid min-w-0 gap-1', className)}
      style={{
        gridTemplateColumns:
          span === 'week'
            ? 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))'
            : `repeat(${shownDows.length}, minmax(0, 1fr))`,
        ...style,
      }}
      {...rest}
    >
      {span === 'month' ? (
        <div role="row" className="contents">
          {shownDows.map((w) => (
            <div
              key={w}
              role="columnheader"
              className="px-2 pb-0.5 text-[11px] font-semibold whitespace-nowrap text-[var(--sk-mute,var(--muted-foreground))]"
            >
              {DOW_SHORT[w]}
            </div>
          ))}
        </div>
      ) : null}
      {rows.map((row, i) => (
        <div key={i} role="row" className="contents">
          {row.map(cell)}
        </div>
      ))}
    </div>
  )
})

export interface CalendarNavProps {
  /** `September 2026` or `Mon 7 – Fri 11 Sep` (see `formatMonthLabel` / `formatWeekLabel`). */
  label: React.ReactNode
  onPrev: () => void
  onNext: () => void
  /** Omit to hide `Today`. */
  onToday?: () => void
  prevLabel?: string
  nextLabel?: string
  className?: string
}

/** §17.9 #9 — `‹ title › Today`, one group, in the toolbar after the views. */
export function CalendarNav({
  label,
  onPrev,
  onNext,
  onToday,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  className,
}: CalendarNavProps) {
  return (
    <div data-slot="calendar-nav" className={cn('flex items-center gap-1.5', className)}>
      <Button type="button" variant="outline" size="xs" onClick={onPrev} aria-label={prevLabel} title={prevLabel}>
        ‹
      </Button>
      <span className="min-w-[120px] text-center text-[13px] font-semibold whitespace-nowrap" aria-live="polite">
        {label}
      </span>
      <Button type="button" variant="outline" size="xs" onClick={onNext} aria-label={nextLabel} title={nextLabel}>
        ›
      </Button>
      {onToday ? (
        <Button type="button" variant="outline" size="xs" onClick={onToday}>
          Today
        </Button>
      ) : null}
    </div>
  )
}
