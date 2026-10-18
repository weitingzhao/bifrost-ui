import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { useLayoutProvided } from '../adaptive/LayoutProvider'
import { RowDetailSheet, ensureKeepRule, keepValue, opensRowSheet } from '../adaptive/rowDetail'
import { cn } from '../lib/cn'
import { useStuckMarks } from '../layout/stuck'
import { denseTable, denseTableCellPadding } from './denseTableClasses'

const thBase = cn(
  denseTableCellPadding,
  'max-w-0 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  /* No overflow-hidden: sticky + overflow clips glyph bottoms on dense uppercase heads. */
  'border-b border-[var(--table-rule)] whitespace-nowrap leading-snug align-middle',
  /* The head sticks on a glass strip (Rev .70 §5): 82% of the ground, a 10px blur,
     parked under whatever the page keeps stuck above it. Inside a sideways-scrolling
     table it sticks within the table's own box. `stickyHeader={false}` lets it scroll. */
  'sticky top-[var(--sticky-offset)] z-[1] bg-[color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-[10px] backdrop-saturate-[1.4]',
)
const tdBase = cn(
  denseTableCellPadding,
  'max-w-0 text-dense-body border-b border-[var(--table-rule)] align-middle overflow-hidden',
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
  stickyHeader = true,
  variant = 'default',
  compactKeep,
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
  /** The head sticks on glass (the default); false lets it scroll with the rows. */
  stickyHeader?: boolean
  /**
   * `list` (0.10.0, Trade design Rev .153 §17.2 "a grid on glass"): the macOS
   * list. The frame opens the list scope (`data-sr-list`, `styles/patterns`):
   * the head has no fill, sentence case, one ink 8% hairline, and turns glass
   * only while stuck over rows (`thead[data-stuck]`, see `useStuckMarks`);
   * rows have no rules, a 3% ink zebra, and hover (ink 7%) / selection
   * (accent 18%) as 6px capsules; the table is inset 6px from its frame.
   * Row state rides `DenseTableRow rowTint` / `selected`. A page can open the
   * same scope on any ancestor instead — every table under it follows; it then
   * marks stuck heads with `useStuckMarks` on that ancestor.
   */
  variant?: 'default' | 'list'
  /**
   * On compact (0.15.0, Trade design Rev .174 B6 · §18.6): keep only these
   * columns, numbered from 1 — `colspan` rows and nested tables are left
   * whole, `tfoot` hides — and a tap on a row opens a sheet with every column
   * ("header · cell"; `Open` when the row itself opens something). A row with
   * `detail="page"` keeps its own click. Matrix tables (shock, correlation,
   * schedule) leave it unset and keep scrolling sideways. Only under a
   * `LayoutProvider`; without one the table is unchanged.
   */
  compactKeep?: readonly number[]
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  // A list table marks its own head stuck; a page that opened the scope on an
  // ancestor marks it there (useStuckMarks) — both run the same measurement.
  useStuckMarks(frameRef, variant === 'list')
  const layout = useLayoutProvided()
  const keep = layout != null && compactKeep != null && compactKeep.length > 0 ? keepValue(compactKeep) : undefined
  useLayoutEffect(() => {
    if (keep) ensureKeepRule(keep)
  }, [keep])
  const [sheetRow, setSheetRow] = useState<HTMLTableRowElement | null>(null)
  const rowTap =
    keep && layout?.w === 'compact'
      ? (e: ReactMouseEvent<HTMLDivElement>) => {
          const target = e.target instanceof Element ? e.target : null
          const tr = target?.closest('tr')
          if (!target || !tr || tr.parentElement?.tagName !== 'TBODY' || tr.closest('table') !== tableRef.current) return
          if (!opensRowSheet(tr, target)) return
          e.preventDefault()
          e.stopPropagation()
          setSheetRow(tr)
        }
      : undefined
  return (
    <>
      <div
        ref={frameRef}
        data-slot="dense-table-frame"
        data-sr-list={variant === 'list' ? '' : undefined}
        data-sr-keep={keep}
        onClickCapture={rowTap}
        data-sticky-head={stickyHeader ? undefined : 'off'}
        className={cn(
          // A table is a group like any other: the card fill, not an outline
          // (Rev .62). The fill is materials.css's and keys on the frame's
          // `border` class, so a caller that drops the frame (`border-0`, a table
          // already inside a card) drops the fill with it.
          'w-full min-w-0 max-w-full rounded-[var(--card-radius)] border border-[var(--card-border)]',
          scrollX ? 'dense-scroll-x' : 'overflow-x-hidden',
          wrapClassName,
        )}
      >
        <table
          ref={tableRef}
          data-sr-table={standard ? '' : undefined}
          className={cn(denseTable.table, !scrollX && 'min-w-0', tableClassName)}
        >
          {children}
        </table>
      </div>
      {keep ? <RowDetailSheet row={layout?.w === 'compact' ? sheetRow : null} onClose={() => setSheetRow(null)} /> : null}
    </>
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
  selected,
  rowTint,
  detail,
  style,
  ...rest
}: {
  children: ReactNode
  className?: string
  /**
   * On compact, in a `compactKeep` table (0.15.0, Rev .174 B6): `sheet` (the
   * default) — a tap opens the row's sheet; `page` — the columns still fold,
   * but the tap is the row's own (the page draws its own detail).
   */
  detail?: 'sheet' | 'page'
  /**
   * The row stands selected (0.10.0): `data-selected="true"`, drawn by the list
   * grammar as an accent 18% capsule. No effect outside a list scope.
   */
  selected?: boolean
  /**
   * The page's own row state — breach, total, the open row — as a colour
   * (0.10.0). Written to `--sr-row`; the list grammar paints it as the row's
   * capsule under hover and selection, over the zebra and over any cell's own
   * background (a heat cell keeps its colour). No effect outside a list scope.
   */
  rowTint?: string
} & ComponentProps<'tr'>) {
  const tinted: CSSProperties | undefined =
    rowTint != null ? ({ ...style, '--sr-row': rowTint } as CSSProperties) : style
  return (
    <tr
      data-selected={selected ? 'true' : undefined}
      data-sr-row-detail={detail === 'page' ? 'page' : undefined}
      className={cn('hover:bg-primary/[0.04] transition-colors', className)}
      style={tinted}
      {...rest}
    >
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
      data-slot="dense-th"
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
    // No band (1a, 0.5.4): the heading sits in its group; hover stays still, as it did.
    // `data-sr-group` (0.10.0): the list grammar reads it as a heading — no fill,
    // no zebra, 600 — and leaves it alone outside a list scope.
    <DenseTableRow data-sr-group="" className={cn('hover:bg-transparent text-dense-meta', className)}>
      {children}
    </DenseTableRow>
  )
}

export function DenseTableDetailRow({
  children,
  className,
  indent,
  style,
}: {
  children: ReactNode
  className?: string
  /**
   * Inside a list scope (Rev .156 §17.2): where the expansion's first cell
   * starts, so it lines up with the parent's first text column (past the
   * disclosure). A CSS length; omitted, the cell keeps its own padding.
   */
  indent?: string | number
  style?: CSSProperties
}) {
  const indentStyle =
    indent == null
      ? style
      : ({ ...style, '--sr-detail-indent': typeof indent === 'number' ? `${indent}px` : indent } as CSSProperties)
  return (
    // `data-sr-detail` (0.12.0): the list grammar draws it as an expansion —
    // no fill, no zebra, no capsule, a hairline under — and leaves it alone
    // outside a list scope.
    <DenseTableRow
      data-sr-detail=""
      style={indentStyle}
      className={cn(
        // No band (1a, 0.5.4): the detail reads as part of its row; hover is a row's.
        'text-dense-meta border-[var(--table-rule)]',
        className,
      )}
    >
      {children}
    </DenseTableRow>
  )
}
