/**
 * DenseList (0.10.0, Trade design Rev .153–.154 §17.2): a list of div rows in
 * the same grammar as a table on glass — rows inset 6px, no rules, a 3% ink
 * zebra, the selected row an accent 18% capsule, and hover (ink 7%) only on a
 * row that does something when clicked.
 *
 *   <DenseList aria-label="Signals">
 *     <DenseListHead className="grid grid-cols-[1fr_80px]">…</DenseListHead>
 *     <DenseListRow className="grid grid-cols-[1fr_80px]" onClick={open} selected={id === openId}>…</DenseListRow>
 *   </DenseList>
 *
 * The page gives the columns (a grid or flex line on each row and the head);
 * the list gives the material. The markup is the pattern's (`data-sr-list` on
 * the list, `data-sr-row` / `data-sr-rowhead` / `data-sr-click` on its lines,
 * `styles/patterns`), so a page may also write the attributes on its own rows.
 */
import type { ComponentProps, CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface DenseListProps extends ComponentProps<'div'> {
  children: ReactNode
}

export function DenseList({ children, className, ...rest }: DenseListProps) {
  return (
    <div data-slot="dense-list" data-sr-list="" role="list" className={cn('flex min-w-0 flex-col', className)} {...rest}>
      {children}
    </div>
  )
}

export interface DenseListHeadProps extends ComponentProps<'div'> {
  children: ReactNode
}

/** The line of column captions over the rows: the same 6px inset, an ink 8% hairline. */
export function DenseListHead({ children, className, ...rest }: DenseListHeadProps) {
  return (
    <div
      data-slot="dense-list-head"
      data-sr-rowhead=""
      role="presentation"
      className={cn('text-dense-meta font-semibold text-muted-foreground', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export interface DenseListRowProps extends Omit<ComponentProps<'div'>, 'onClick'> {
  children: ReactNode
  /** The row stands selected: an accent 18% capsule (`data-selected="true"`). */
  selected?: boolean
  /**
   * The row opens something. Only then does it take hover, focus (Tab) and
   * Enter / Space (`data-sr-click`).
   */
  onClick?: (e: React.MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void
  /** The page's own row state as a colour, written to `--sr-row`. */
  tint?: string
}

export function DenseListRow({
  children,
  selected,
  onClick,
  tint,
  className,
  style,
  onKeyDown,
  ...rest
}: DenseListRowProps) {
  const clickable = onClick != null
  const tinted: CSSProperties | undefined =
    tint != null ? ({ ...style, '--sr-row': tint } as CSSProperties) : style
  return (
    <div
      data-slot="dense-list-row"
      data-sr-row=""
      data-sr-click={clickable ? '' : undefined}
      data-selected={selected ? 'true' : undefined}
      role="listitem"
      aria-current={selected ? 'true' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        // Only the row's own keys: Enter inside a field or a button in the row is theirs.
        if (!clickable || e.defaultPrevented || e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e)
        }
      }}
      className={cn('text-dense-body', clickable && 'cursor-pointer', className)}
      style={tinted}
      {...rest}
    >
      {children}
    </div>
  )
}
