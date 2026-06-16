import type { ComponentProps, KeyboardEvent, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { denseTable, denseTableCellPadding } from './denseTableClasses'

const thBase = cn(
  denseTableCellPadding,
  'max-w-0 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  'border-b border-border bg-surface-elevated whitespace-nowrap overflow-hidden',
  'sticky top-0 z-[1]',
)
const tdBase = cn(
  denseTableCellPadding,
  'max-w-0 text-dense-body border-b border-border/60 align-middle overflow-hidden',
)

export function DenseDataTable({
  children,
  wrapClassName,
  tableClassName,
}: {
  children: ReactNode
  wrapClassName?: string
  tableClassName?: string
}) {
  return (
    <div className={cn('dense-scroll-x rounded-lg border border-border', wrapClassName)}>
      <table className={cn(denseTable.table, tableClassName)}>
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
}: {
  children?: ReactNode
  className?: string
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
      className={cn(
        thBase,
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
  ...rest
}: {
  children?: ReactNode
  className?: string
  title?: string
  colSpan?: number
} & Omit<ComponentProps<'td'>, 'children' | 'className' | 'title' | 'colSpan'>) {
  return (
    <td className={cn(tdBase, className)} title={title} colSpan={colSpan} {...rest}>
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
