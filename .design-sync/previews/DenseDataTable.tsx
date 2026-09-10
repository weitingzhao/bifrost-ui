import {
  DenseDataTable,
  DenseTableBody,
  DenseTableCell,
  DenseTableDetailRow,
  DenseTableHead,
  DenseTableHeader,
  DenseTableHeadRow,
  DenseTableRow,
  DenseTableSubheadRow,
  DenseTag,
  denseTableNumCell,
} from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

const POSITIONS = [
  { sym: 'NVDA', contract: 'NOV21 190C', qty: '−2', mark: '8.42', delta: '−0.31', theta: '+18.40', pnl: '+1,284.00' },
  { sym: 'NVDA', contract: 'NOV21 195C', qty: '−1', mark: '6.05', delta: '−0.22', theta: '+9.10', pnl: '+412.50' },
  { sym: 'TLT', contract: 'NOV21 88P', qty: '−4', mark: '1.18', delta: '+0.14', theta: '+22.60', pnl: '−96.00' },
  { sym: 'SMCI', contract: 'DEC19 42C', qty: '+3', mark: '3.75', delta: '+0.58', theta: '−31.20', pnl: '−540.75' },
]

const pnlClass = (v: string) =>
  v.startsWith('−') ? 'text-lamp-red' : 'text-lamp-green'

/** The canonical dense table: sticky uppercase head, numeric columns on
    `denseTableNumCell` (right-aligned, tabular mono), one border per row and
    nothing else. Every column that holds a number is monospaced so digits line
    up down the column — that is the whole reason this table exists. */
export const OptionPositions = () => (
  <Surface>
    <DenseDataTable>
      <DenseTableHeader>
        <DenseTableHeadRow>
          <DenseTableHead>Symbol</DenseTableHead>
          <DenseTableHead>Contract</DenseTableHead>
          <DenseTableHead align="right">Qty</DenseTableHead>
          <DenseTableHead align="right">Mark</DenseTableHead>
          <DenseTableHead align="right">Δ</DenseTableHead>
          <DenseTableHead align="right">Θ / day</DenseTableHead>
          <DenseTableHead align="right">Unrealised</DenseTableHead>
        </DenseTableHeadRow>
      </DenseTableHeader>
      <DenseTableBody>
        {POSITIONS.map(p => (
          <DenseTableRow key={p.sym + p.contract}>
            <DenseTableCell className="font-semibold">{p.sym}</DenseTableCell>
            <DenseTableCell className="text-muted-foreground">{p.contract}</DenseTableCell>
            <DenseTableCell className={denseTableNumCell}>{p.qty}</DenseTableCell>
            <DenseTableCell className={denseTableNumCell}>{p.mark}</DenseTableCell>
            <DenseTableCell className={denseTableNumCell}>{p.delta}</DenseTableCell>
            <DenseTableCell className={denseTableNumCell}>{p.theta}</DenseTableCell>
            <DenseTableCell className={`${denseTableNumCell} ${pnlClass(p.pnl)}`}>{p.pnl}</DenseTableCell>
          </DenseTableRow>
        ))}
      </DenseTableBody>
    </DenseDataTable>
  </Surface>
)

/** `DenseTableSubheadRow` breaks the body into labelled sections without a
    second table; `DenseTableDetailRow` carries the expanded child of the row
    above it. Both are quieter than a data row on purpose. */
export const GroupedWithDetail = () => (
  <Surface>
    <DenseDataTable>
      <DenseTableHeader>
        <DenseTableHeadRow>
          <DenseTableHead>Instrument</DenseTableHead>
          <DenseTableHead align="right">Qty</DenseTableHead>
          <DenseTableHead align="right">Backing</DenseTableHead>
          <DenseTableHead align="right">Room to add</DenseTableHead>
        </DenseTableHeadRow>
      </DenseTableHeader>
      <DenseTableBody>
        <DenseTableSubheadRow>
          <DenseTableCell colSpan={4} className="font-semibold uppercase tracking-wide">
            U1234567 — Margin
          </DenseTableCell>
        </DenseTableSubheadRow>
        <DenseTableRow>
          <DenseTableCell>SGOV</DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>1,400</DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>$140,560</DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>2 contracts</DenseTableCell>
        </DenseTableRow>
        <DenseTableDetailRow>
          <DenseTableCell colSpan={4} className="text-muted-foreground">
            Counted at buying power, not cash — a fixed-income ETF backs a put without settling.
          </DenseTableCell>
        </DenseTableDetailRow>
        <DenseTableSubheadRow>
          <DenseTableCell colSpan={4} className="font-semibold uppercase tracking-wide">
            U7654321 — IRA
          </DenseTableCell>
        </DenseTableSubheadRow>
        <DenseTableRow>
          <DenseTableCell>TLT</DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>600</DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>$52,140</DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>0 contracts</DenseTableCell>
        </DenseTableRow>
      </DenseTableBody>
    </DenseDataTable>
  </Surface>
)

/** `scrollX={false}` fits every column to the container instead of scrolling.
    Use it only when the column count is fixed and small — a wide table that
    fits by squeezing is worse than one that scrolls. */
export const FitToContainer = () => (
  <Surface>
    <DenseDataTable scrollX={false}>
      <DenseTableHeader>
        <DenseTableHeadRow>
          <DenseTableHead>Stream</DenseTableHead>
          <DenseTableHead>State</DenseTableHead>
          <DenseTableHead align="right">Msg/s</DenseTableHead>
        </DenseTableHeadRow>
      </DenseTableHeader>
      <DenseTableBody>
        <DenseTableRow>
          <DenseTableCell>ib_ingestor</DenseTableCell>
          <DenseTableCell><DenseTag variant="success">streaming</DenseTag></DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>1,204</DenseTableCell>
        </DenseTableRow>
        <DenseTableRow>
          <DenseTableCell>polygon_ws</DenseTableCell>
          <DenseTableCell><DenseTag variant="warning">reconnecting</DenseTag></DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>0</DenseTableCell>
        </DenseTableRow>
        <DenseTableRow>
          <DenseTableCell>flex_query</DenseTableCell>
          <DenseTableCell><DenseTag variant="neutral">idle</DenseTag></DenseTableCell>
          <DenseTableCell className={denseTableNumCell}>—</DenseTableCell>
        </DenseTableRow>
      </DenseTableBody>
    </DenseDataTable>
  </Surface>
)
