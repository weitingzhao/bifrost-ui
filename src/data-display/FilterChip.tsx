/**
 * Filter controls for "pick several" (Trade design Rev .150 · DESIGN_CONTRACTS
 * §17.10). One look per way of choosing:
 *
 * - `FilterChip`  — one on/off filter. On = ink 15% fill + ink; off = ink 4%
 *   (or, in a joined tray, no fill) + mute ink; an optional mono count;
 *   `aria-pressed`. **No accent**: the accent is for the page's one current
 *   thing, never a filter state (§17.10 rule 1). Rev .156 adds `size="sm"`,
 *   `dashed` (narrative condition) and `missing` (no value in range).
 * - `FilterTray`  — the fill several chips sit in. `group` (default): a padded
 *   ink 4% tray, radius 14, chips as pills. `joined`: chips flush in one
 *   capsule, radius 12 (Positions / Backing Scope · Type).
 * - `FilterGroup` — a business group of chips in a tray whose head is a
 *   tri-state checkbox (all ✓ · some – · none): click = all → none, otherwise
 *   → all. The group name dims with the state (soft · mute2 · mute).
 *
 * `SegmentControl` stays the control for pick-one; `IncludeExcludeToggle` for
 * include / exclude.
 */
import * as React from 'react'

import { cn } from '../lib/cn'

type TrayVariant = 'group' | 'joined'

const TrayContext = React.createContext<TrayVariant | null>(null)

// ── FilterChip ──────────────────────────────────────────────────────────

export interface FilterChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** On or off. Written as `aria-pressed`. */
  pressed: boolean
  /** Called with the next state on click (unless the click handler prevented it). */
  onPressedChange?: (next: boolean) => void
  /** A count after the label, mono and mute (e.g. this month's items on a layer). */
  count?: React.ReactNode
  /** `sm` (Rev .156): height 20 · 11px · 7px sides, for a narrow rail (Method). */
  size?: 'default' | 'sm'
  /**
   * A narrative condition (not in the model, Rev .156 §17.10): an ink 30%
   * dashed outline, drawn on and off.
   */
  dashed?: boolean
  /**
   * The condition has no value over the current range (Rev .156 §17.10):
   * ink 4% fill + faint ink, not clickable (`aria-disabled`). Put the reason
   * in `title`.
   */
  missing?: boolean
}

/**
 * One filter you turn on or off. It is a plain `<button>` that forwards its
 * ref and every button prop, so a chip can be dragged (`draggable`,
 * `onDragStart` …) or carry a grip as part of its children.
 */
export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(function FilterChip(
  {
    pressed,
    onPressedChange,
    count,
    size = 'default',
    dashed = false,
    missing = false,
    className,
    children,
    onClick,
    type = 'button',
    ...rest
  },
  ref,
) {
  const tray = React.useContext(TrayContext)
  const joined = tray === 'joined'
  return (
    <button
      ref={ref}
      type={type}
      data-slot="filter-chip"
      data-state={pressed ? 'on' : 'off'}
      data-size={size === 'sm' ? 'sm' : undefined}
      data-dashed={dashed || undefined}
      data-missing={missing || undefined}
      aria-pressed={pressed}
      aria-disabled={missing || undefined}
      onClick={(e) => {
        if (missing) {
          e.preventDefault()
          return
        }
        onClick?.(e)
        if (!e.defaultPrevented) onPressedChange?.(!pressed)
      }}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap outline-none transition-colors',
        dashed
          ? 'border border-dashed border-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_30%,transparent)]'
          : 'border-0',
        'focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default disabled:opacity-50',
        joined
          ? 'h-[22px] rounded-none px-2.5 text-[11px] font-semibold'
          : size === 'sm'
            ? 'h-5 rounded-full px-[7px] text-[11px] font-medium'
            : 'h-6 rounded-full px-2.5 text-[12px] font-medium',
        missing
          ? 'cursor-default bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_4%,transparent)] text-[var(--sk-faint,var(--muted-foreground))]'
          : pressed
            ? 'bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_15%,transparent)] text-[var(--sk-ink,var(--foreground))] hover:bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_19%,transparent)]'
            : cn(
                joined ? 'bg-transparent' : 'bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_4%,transparent)]',
                'text-[var(--sk-mute2,var(--muted-foreground))] hover:bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_8%,transparent)] hover:text-[var(--sk-ink,var(--foreground))]',
              ),
        className,
      )}
      {...rest}
    >
      {children}
      {count != null && count !== '' ? (
        <span
          data-slot="filter-chip-count"
          className={cn(
            'font-mono font-normal tabular-nums text-[var(--sk-mute,var(--muted-foreground))]',
            size === 'sm' ? 'text-[10px]' : 'text-[11px]',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
})

// ── FilterTray ──────────────────────────────────────────────────────────

export interface FilterTrayProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * `group` (default): an ink 4% tray, radius 14, padded, chips as pills with
   * a 4px gap. `joined`: the chips flush in one capsule, radius 12, no gap —
   * a short on/off set such as accounts in scope or holding types.
   */
  variant?: TrayVariant
}

export const FilterTray = React.forwardRef<HTMLDivElement, FilterTrayProps>(function FilterTray(
  { variant = 'group', className, children, role = 'group', ...rest },
  ref,
) {
  return (
    <TrayContext.Provider value={variant}>
      <div
        ref={ref}
        role={role}
        data-slot="filter-tray"
        data-variant={variant}
        className={cn(
          'min-w-0 border border-transparent bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_4%,transparent)]',
          variant === 'joined'
            ? 'inline-flex overflow-hidden rounded-[12px]'
            : 'flex flex-wrap items-center gap-1 rounded-[14px] py-[3px] pr-1 pl-2.5',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </TrayContext.Provider>
  )
})

// ── FilterGroup ─────────────────────────────────────────────────────────

export type FilterGroupState = 'all' | 'some' | 'none'

/** How many of `ids` are on in `value`: all, some or none. An empty group reads as none. */
export function filterGroupState(ids: readonly string[], value: ReadonlySet<string>): FilterGroupState {
  const on = ids.filter((id) => value.has(id)).length
  if (on === 0 || ids.length === 0) return 'none'
  return on === ids.length ? 'all' : 'some'
}

/**
 * The group head's click (§17.10): all on → all off; otherwise (some or none)
 * → all on. Ids outside the group keep their state.
 */
export function nextGroupValue(ids: readonly string[], value: ReadonlySet<string>): Set<string> {
  const next = new Set(value)
  const allOn = filterGroupState(ids, value) === 'all'
  for (const id of ids) {
    if (allOn) next.delete(id)
    else next.add(id)
  }
  return next
}

export interface FilterGroupItem {
  id: string
  label: React.ReactNode
  count?: React.ReactNode
  /** Hover text, e.g. which page the layer is read from. */
  title?: string
  disabled?: boolean
}

export interface FilterGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The group's business name (`Book & market`). */
  label: string
  items: readonly FilterGroupItem[]
  /** Every id that is on — this group's and any other's. */
  value: ReadonlySet<string> | readonly string[]
  /** The whole next set (ids outside this group untouched). */
  onChange: (next: Set<string>) => void
}

const BOX: Record<FilterGroupState, string> = {
  all: 'bg-[var(--sk-ink,var(--foreground))]',
  some: 'bg-[var(--sk-ink,var(--foreground))]',
  none: 'bg-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_12%,transparent)]',
}

const NAME: Record<FilterGroupState, string> = {
  all: 'text-[var(--sk-soft,var(--foreground))]',
  some: 'text-[var(--sk-mute2,var(--muted-foreground))]',
  none: 'text-[var(--sk-mute,var(--muted-foreground))]',
}

export function FilterGroup({ label, items, value, onChange, className, ...rest }: FilterGroupProps) {
  const set = React.useMemo(() => (value instanceof Set ? value : new Set(value as readonly string[])), [value])
  const ids = React.useMemo(() => items.filter((i) => !i.disabled).map((i) => i.id), [items])
  const state = filterGroupState(ids, set)
  const onN = ids.filter((id) => set.has(id)).length
  return (
    <FilterTray aria-label={label} className={className} {...rest}>
      <button
        type="button"
        role="checkbox"
        aria-checked={state === 'all' ? true : state === 'some' ? 'mixed' : false}
        data-slot="filter-group-head"
        data-state={state}
        title={`${state === 'all' ? 'Hide all' : 'Show all'} ${label} · ${onN} of ${ids.length} on`}
        onClick={() => onChange(nextGroupValue(ids, set))}
        className={cn(
          'mr-0.5 inline-flex cursor-pointer items-center gap-1.5 border-r bg-transparent py-0 pr-2 pl-0 text-[11px] font-semibold outline-none',
          'border-r-[color-mix(in_srgb,var(--sk-ink,var(--foreground))_14%,transparent)] focus-visible:ring-2 focus-visible:ring-ring/50',
          NAME[state],
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex size-3 flex-none items-center justify-center rounded-[3px] text-[9px] leading-none font-extrabold text-[var(--background)]',
            BOX[state],
          )}
        >
          {state === 'all' ? '✓' : state === 'some' ? '–' : ''}
        </span>
        {label}
      </button>
      {items.map((it) => (
        <FilterChip
          key={it.id}
          pressed={set.has(it.id)}
          count={it.count}
          title={it.title}
          disabled={it.disabled}
          onPressedChange={(on) => {
            const next = new Set(set)
            if (on) next.add(it.id)
            else next.delete(it.id)
            onChange(next)
          }}
        >
          {it.label}
        </FilterChip>
      ))}
    </FilterTray>
  )
}
