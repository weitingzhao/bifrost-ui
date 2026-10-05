/**
 * TimeStrip (Trade design Rev .146 · §17.9): dates along one axis. The frame
 * and the behaviour are shared; what sits on a day is the page's.
 *
 * Three forms:
 * - `marks` — a row of days, each with marks under its date (Corporate
 *   Actions: symbol + action).
 * - `lanes` — one row per lane (Events: Macro · OPEX · Book · Watchlist);
 *   `renderLane(lane, date)` fills a cell.
 * - `bars`  — one column per date with a bar (Expiry ladder: contracts ·
 *   delta · notional); marks above the bar, the date and `renderSub` under it.
 *   The selected column's bar is solid, the others 45%; an empty day is a 2px
 *   stub.
 *
 * Shared rules: the columns are the dates you pass (`stripDates` builds the
 * §17.9 set — weekdays, a weekend day only when something is on it). Today is
 * a 60% accent line down the left of its column with `today` at the top; if
 * today comes before the first column, a lead column carries the line. A
 * Monday carries an ink 8% rule. With the strip focused: ← → move the
 * selection, Home / End the ends, [ ] the previous / next screen (`onPage`).
 */
import * as React from 'react'

import { cn } from '../lib/cn'
import { DOW_SHORT, MON_SHORT, formatDayLabel, isoDow } from '../lib/calendarDates'

export interface TimeStripLane {
  id: string
  label: React.ReactNode
  /** The lane label's ink (an entity colour: ticker, contract …). */
  ink?: string
}

export interface TimeStripProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** The columns, `YYYY-MM-DD`, in order. */
  dates: readonly string[]
  /** The caller's today. */
  today?: string
  /** Default `marks`; `lanes` when `lanes` is given; `bars` when `barValue` is. */
  variant?: 'marks' | 'lanes' | 'bars'
  selected?: string | null
  onSelect?: (date: string) => void
  /** `[` / `]`: the previous / next screen. */
  onPage?: (dir: -1 | 1) => void
  lanes?: readonly TimeStripLane[]
  renderLane?: (laneId: string, date: string) => React.ReactNode
  /** Marks for a day: under the date (`marks`, `lanes`) or above the bar (`bars`). */
  renderMarks?: (date: string) => React.ReactNode
  /** `bars`: the bar's value (null / 0 = nothing that day). */
  barValue?: (date: string) => number | null | undefined
  /** `bars`: the value of a full bar (default the largest in view). */
  barMax?: number
  /** `bars`: the bar's ink (default the contract colour). */
  barInk?: string
  /** `bars`: the reading over the bar (`6`, `+174 Δ`, `$109k`). */
  renderValue?: (date: string) => React.ReactNode
  /** `bars`: a line under the date (`7d`). */
  renderSub?: (date: string) => React.ReactNode
  /** A column's hover text (default `Fri 18 Sep`). */
  dayTitle?: (date: string) => string
  /** Default 20 (`marks`), 28 (`lanes`), 56 (`bars`). */
  minColumnWidth?: number
  /** `lanes`: the label column (default 92). */
  laneLabelWidth?: number
  /** `bars`: the bar area's height (default 90). */
  barHeight?: number
}

const ACCENT_LINE = 'inset 1px 0 0 color-mix(in srgb, var(--sk-accent, var(--primary)) 60%, transparent)'
const MONDAY_LINE = 'inset 1px 0 0 color-mix(in srgb, var(--sk-ink, var(--foreground)) 8%, transparent)'

function isTyping(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)
}

export const TimeStrip = React.forwardRef<HTMLDivElement, TimeStripProps>(function TimeStrip(
  {
    dates,
    today,
    variant: variantProp,
    selected = null,
    onSelect,
    onPage,
    lanes,
    renderLane,
    renderMarks,
    barValue,
    barMax,
    barInk = 'var(--sk-contract)',
    renderValue,
    renderSub,
    dayTitle,
    minColumnWidth,
    laneLabelWidth = 92,
    barHeight = 90,
    className,
    onKeyDown,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const variant = variantProp ?? (lanes ? 'lanes' : barValue ? 'bars' : 'marks')
  const baseId = React.useId()
  const colW = minColumnWidth ?? (variant === 'bars' ? 56 : variant === 'lanes' ? 28 : 20)
  const lead = !!today && dates.length > 0 && !dates.includes(today) && today < dates[0]
  const labelCol = variant === 'lanes'
  const max = React.useMemo(() => {
    if (variant !== 'bars') return 1
    if (barMax != null) return Math.max(barMax, 1e-9)
    return Math.max(1e-9, ...dates.map((d) => Math.abs(barValue?.(d) ?? 0)))
  }, [variant, barMax, dates, barValue])

  const template = [lead ? '40px' : null, labelCol ? `${laneLabelWidth}px` : null, `repeat(${dates.length}, minmax(${colW}px, 1fr))`]
    .filter(Boolean)
    .join(' ')
  const minWidth = (lead ? 40 : 0) + (labelCol ? laneLabelWidth : 0) + dates.length * colW

  const edge = (d: string) => (d === today ? ACCENT_LINE : isoDow(d) === 1 ? MONDAY_LINE : undefined)
  const selFill = 'bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_9%,transparent)]'
  const title = (d: string) => (dayTitle ? dayTitle(d) : formatDayLabel(d))
  const cellId = (d: string) => `${baseId}-${d}`

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
    const i = selected ? dates.indexOf(selected) : -1
    let j = -1
    if (e.key === 'ArrowRight') j = i < 0 ? 0 : Math.min(dates.length - 1, i + 1)
    else if (e.key === 'ArrowLeft') j = i < 0 ? 0 : Math.max(0, i - 1)
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = dates.length - 1
    else if ((e.key === '[' || e.key === ']') && onPage) {
      e.preventDefault()
      onPage(e.key === '[' ? -1 : 1)
      return
    }
    if (j < 0 || !onSelect || !dates[j]) return
    e.preventDefault()
    if (dates[j] !== selected) onSelect(dates[j])
  }

  const head = (d: string) => {
    const isToday = d === today
    const w = isoDow(d)
    return (
      <div
        key={`h-${d}`}
        role="columnheader"
        title={title(d)}
        data-date={d}
        className={cn('flex min-w-0 flex-col items-center px-0 pt-1 pb-1', d === selected && selFill)}
        style={{ boxShadow: edge(d) }}
      >
        <span
          className={cn(
            'text-[9px] leading-3',
            isToday
              ? 'font-semibold text-[var(--sk-accent,var(--primary))]'
              : w === 0 || w === 6
                ? 'text-[var(--sk-mute,var(--muted-foreground))]'
                : 'text-[var(--sk-mute2,var(--muted-foreground))]',
          )}
        >
          {isToday ? 'today' : DOW_SHORT[w].slice(0, 2)}
        </span>
        <span
          className={cn(
            'font-mono text-[11px] tabular-nums',
            isToday ? 'font-bold text-[var(--sk-accent,var(--primary))]' : 'text-[var(--sk-mute2,var(--muted-foreground))]',
          )}
        >
          {Number(d.slice(8))}
        </span>
      </div>
    )
  }

  const leadCell = (row: 'head' | 'body', key: string) =>
    lead ? (
      <div
        key={key}
        role={row === 'head' ? 'columnheader' : 'gridcell'}
        aria-label={row === 'head' || variant === 'bars' ? `Today, ${formatDayLabel(today!)}` : undefined}
        className="flex flex-col items-center gap-1"
      >
        {row === 'head' || variant === 'bars' ? (
          <span className="pt-1 text-[10px] font-semibold text-[var(--sk-accent,var(--primary))]">today</span>
        ) : null}
        <div className="min-h-2 flex-1" style={{ boxShadow: ACCENT_LINE }} />
        {row === 'body' && variant === 'bars' ? (
          <span className="font-mono text-[10px] text-[var(--sk-mute,var(--muted-foreground))]">
            {Number(today!.slice(8))} {MON_SHORT[Number(today!.slice(5, 7)) - 1]}
          </span>
        ) : null}
      </div>
    ) : null

  const body = (d: string) => {
    const isSel = d === selected
    const common = {
      role: 'gridcell',
      id: cellId(d),
      'aria-selected': onSelect ? isSel : undefined,
      'data-date': d,
      title: title(d),
      onClick: onSelect ? () => onSelect(d) : undefined,
      style: { boxShadow: edge(d) },
    } as const
    if (variant === 'bars') {
      const v = barValue?.(d) ?? 0
      const h = v ? Math.max(6, Math.round((Math.abs(v) / max) * (barHeight - 2))) : 2
      return (
        <div
          key={`b-${d}`}
          {...common}
          className={cn(
            'flex min-w-0 flex-col items-center gap-1 rounded-[8px] px-0.5 pt-1 pb-1.5',
            onSelect && 'cursor-pointer',
            isSel ? selFill : onSelect && 'hover:bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_7%,transparent)]',
          )}
        >
          <div className="flex h-[30px] max-w-full min-w-0 flex-col items-center justify-end gap-px overflow-hidden text-[9px] leading-3">
            {renderMarks?.(d)}
          </div>
          <span
            className={cn(
              'font-mono text-[11px] font-semibold tabular-nums',
              v ? 'text-[var(--sk-ink,var(--foreground))]' : 'text-[var(--sk-mute,var(--muted-foreground))]',
            )}
          >
            {renderValue ? renderValue(d) : v ? String(v) : '—'}
          </span>
          <div className="flex w-full items-end justify-center" style={{ height: barHeight }}>
            <div
              data-slot="time-strip-bar"
              className="w-[60%] max-w-8 rounded-t-[6px] rounded-b-[2px]"
              style={{
                height: h,
                background: !v
                  ? 'color-mix(in srgb, var(--sk-ink, var(--foreground)) 12%, transparent)'
                  : isSel
                    ? barInk
                    : `color-mix(in srgb, ${barInk} 45%, transparent)`,
              }}
            />
          </div>
          <span
            className={cn(
              'text-[11px] whitespace-nowrap',
              d === today
                ? 'font-bold text-[var(--sk-accent,var(--primary))]'
                : isSel
                  ? 'font-bold text-[var(--sk-ink,var(--foreground))]'
                  : 'text-[var(--sk-mute2,var(--muted-foreground))]',
            )}
          >
            {Number(d.slice(8))} {MON_SHORT[Number(d.slice(5, 7)) - 1]}
          </span>
          {renderSub ? (
            <span className="font-mono text-[10px] text-[var(--sk-mute,var(--muted-foreground))]">{renderSub(d)}</span>
          ) : null}
        </div>
      )
    }
    // marks
    return (
      <div
        key={`m-${d}`}
        {...common}
        className={cn(
          'flex min-w-0 flex-col items-center gap-0.5 pt-0.5 pb-1',
          onSelect && 'cursor-pointer',
          isSel && selFill,
        )}
      >
        {renderMarks?.(d)}
      </div>
    )
  }

  const laneCell = (laneId: string, d: string) => (
    <div
      key={`${laneId}-${d}`}
      role="gridcell"
      id={laneId === lanes?.[0]?.id ? cellId(d) : undefined}
      aria-selected={onSelect ? d === selected : undefined}
      data-date={d}
      onClick={onSelect ? () => onSelect(d) : undefined}
      className={cn(
        'flex min-h-8 min-w-0 items-center justify-center px-0.5 py-1',
        onSelect && 'cursor-pointer',
        d === selected && selFill,
      )}
      style={{ boxShadow: edge(d) }}
    >
      {renderLane?.(laneId, d)}
    </div>
  )

  const rowCls = 'contents'
  return (
    <div
      ref={ref}
      data-slot="time-strip"
      data-variant={variant}
      className={cn('min-w-0 overflow-x-auto', className)}
      {...rest}
    >
      <div
        role="grid"
        aria-label={ariaLabel ?? 'Timeline'}
        aria-activedescendant={selected && dates.includes(selected) ? cellId(selected) : undefined}
        tabIndex={0}
        onKeyDown={handleKey}
        className="grid rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        style={{ gridTemplateColumns: template, minWidth }}
      >
        {variant !== 'bars' ? (
          <div role="row" className={rowCls}>
            {leadCell('head', 'lead-h')}
            {labelCol ? <div role="columnheader" aria-label="Lane" /> : null}
            {dates.map(head)}
          </div>
        ) : null}
        {variant === 'lanes' ? (
          <>
            {renderMarks ? (
              <div role="row" className={rowCls}>
                {lead ? <div role="gridcell" /> : null}
                <div role="rowheader" />
                {dates.map((d) => (
                  <div key={`mk-${d}`} role="gridcell" className="flex min-w-0 flex-col items-center gap-0.5" style={{ boxShadow: edge(d) }}>
                    {renderMarks(d)}
                  </div>
                ))}
              </div>
            ) : null}
            {(lanes ?? []).map((lane) => (
              <div key={lane.id} role="row" className={rowCls}>
                {lead ? <div role="gridcell" style={{ boxShadow: ACCENT_LINE }} className="mx-auto w-px" /> : null}
                <div
                  role="rowheader"
                  className="flex items-center px-2.5 py-2 text-[11px] font-semibold"
                  style={{ color: lane.ink ?? 'var(--sk-mute2, var(--muted-foreground))' }}
                >
                  {lane.label}
                </div>
                {dates.map((d) => laneCell(lane.id, d))}
              </div>
            ))}
          </>
        ) : (
          <div role="row" className={rowCls}>
            {leadCell('body', 'lead-b')}
            {dates.map(body)}
          </div>
        )}
      </div>
    </div>
  )
})
