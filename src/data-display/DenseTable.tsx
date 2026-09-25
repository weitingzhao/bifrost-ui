import type { ComponentProps, KeyboardEvent, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { denseTable, denseTableCellPadding } from './denseTableClasses'

const thBase = cn(
  denseTableCellPadding,
  'max-w-0 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  /* No overflow-hidden: sticky + overflow clips glyph bottoms on dense uppercase heads. */
  'border-b border-border bg-surface-elevated whitespace-nowrap leading-snug align-middle',
  'sticky top-0 z-[1]',
)
const tdBase = cn(
  denseTableCellPadding,
  'max-w-0 text-dense-body border-b border-border/60 align-middle overflow-hidden',
)

/**
 * A column's type (§17.2), which decides its alignment and whether it may be
 * cut: `entity` / `num` / `tag` never truncate, `text` is the one column that
 * gives way (ellipsis, whole text in `title`), `wrap` folds, `act` is the row's
 * actions. `dyn` is a column whose type the data decides.
 */
export type DenseCol = 'entity' | 'num' | 'tag' | 'text' | 'wrap' | 'act' | 'dyn'

export function DenseDataTable({
  children,
  wrapClassName,
  tableClassName,
  scrollX = true,
  standard = false,
}: {
  children: ReactNode
  wrapClassName?: string
  tableClassName?: string
  /** When false, fit all columns to the container (no horizontal scrollbar). */
  scrollX?: boolean
  /**
   * Opt the table into the §17.2 standard (`styles/patterns`): the header,
   * cell metrics and column types the design uses everywhere. Pages move one at
   * a time, so it is off until a page asks for it.
   */
  standard?: boolean
}) {
  return (
    <div
      className={cn(
        'w-full min-w-0 max-w-full rounded-lg border border-border',
        scrollX ? 'dense-scroll-x' : 'overflow-x-hidden',
        wrapClassName,
      )}
    >
      <table
        data-sr-table={standard ? '' : undefined}
        className={cn(denseTable.table, !scrollX && 'min-w-0', tableClassName)}
      >
        {children}
      </table>
    </div>
  )
}

export function DenseTableHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <thead className={className}>{children}</thead>
}

export function DenseTableBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <tbody className={className}>{children}</tbody>
}

export function DenseTableHeadRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>
}

export function DenseTableRow({
  children,
  className,
  ...rest
}: {
  children: ReactNode
  className?: string
} & ComponentProps<'tr'>) {
  return (
    <tr className={cn('hover:bg-primary/[0.04] transition-colors', className)} {...rest}>
      {children}
    </tr>
  )
}

export function DenseTableHead({
  children,
  className,
  align,
  title,
  role,
  tabIndex,
  rowSpan,
  colSpan,
  scope,
  'aria-sort': ariaSort,
  'aria-label': ariaLabel,
  onClick,
  onKeyDown,
  col,
}: {
  children?: ReactNode
  className?: string
  /** The column's type (§17.2); set, it replaces `align` and lifts the default cut. */
  col?: DenseCol
  align?: 'left' | 'right' | 'center'
  title?: string
  role?: string
  tabIndex?: number
  rowSpan?: number
  colSpan?: number
  scope?: string
  'aria-sort'?: 'ascending' | 'descending' | 'none' | undefined
  'aria-label'?: string
  onClick?: (e: React.MouseEvent) => void
  onKeyDown?: (e: KeyboardEvent) => void
}) {
  return (
    <th
      data-sr-col={col}
      className={cn(
        thBase,
        col != null && col !== 'text' && 'max-w-none',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      title={title}
      role={role}
      tabIndex={tabIndex}
      rowSpan={rowSpan}
      colSpan={colSpan}
      scope={scope}
      aria-sort={ariaSort}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </th>
  )
}

export function DenseTableCell({
  children,
  className,
  title,
  colSpan,
  col,
  ...rest
}: {
  children?: ReactNode
  className?: string
  title?: string
  colSpan?: number
  /** The column's type (§17.2). Only `text` keeps the cut; the others show whole. */
  col?: DenseCol
} & Omit<ComponentProps<'td'>, 'children' | 'className' | 'title' | 'colSpan'>) {
  return (
    <td
      data-sr-col={col}
      className={cn(tdBase, col != null && col !== 'text' && 'max-w-none overflow-visible', className)}
      title={title}
      colSpan={colSpan}
      {...rest}
    >
      {children}
    </td>
  )
}

export function DenseTableSubheadRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <DenseTableRow className={cn('bg-secondary/30 hover:bg-secondary/30 text-dense-meta', className)}>
      {children}
    </DenseTableRow>
  )
}

export function DenseTableDetailRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <DenseTableRow
      className={cn(
        'bg-secondary/15 text-dense-meta hover:bg-secondary/25 border-border/40',
        className,
      )}
    >
      {children}
    </DenseTableRow>
  )
}
