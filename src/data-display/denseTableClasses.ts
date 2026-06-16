export const denseTable = {
  table: 'w-full min-w-[320px] table-fixed border-collapse text-dense-body',
  sectionBlock: 'flex min-w-0 flex-col gap-3',
  sectionTitle: 'text-sm font-semibold tracking-tight text-foreground',
  emptyHint: 'text-xs text-muted-foreground',
  sortableHead: 'cursor-pointer select-none hover:text-foreground',
  mutedMeta: 'text-muted-foreground text-dense-meta',
  detailCellClip: 'min-w-0 overflow-hidden',
  detailRowLabel: 'block truncate',
  entityCell:
    'min-w-0 max-w-none overflow-visible whitespace-normal break-words [overflow-wrap:anywhere] align-top',
  entityLink: 'block w-full max-w-full whitespace-normal break-words text-left',
  scrollX: 'dense-scroll-x',
  expandCol: 'w-8 max-w-none shrink-0 overflow-visible px-0.5',
  expandColCell: 'w-8 max-w-none shrink-0 overflow-visible p-0 align-middle',
} as const

export const denseTableCellPadding =
  'py-[var(--table-cell-py)] px-[var(--table-cell-px)]'

export const denseTableNumCell = 'text-right font-mono tabular-nums'

export const denseTableEntityCell = denseTable.entityCell

export const denseTableEntityLink = denseTable.entityLink
