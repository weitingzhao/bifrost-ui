import { useMemo, useState } from 'react'
import './ledger.css'
import { CardView } from '../city/CardView'
import type { Block, Cell, Word } from '../city/cards'
import { objectsIn, pathKey, readingView, type ObservationContext, type ObservationSnapshot } from '../city/observation'

type Table = Extract<Block, { kind: 'table' }>
export type LedgerGridProps = {
  table: Table
  selected: string
  onSelect: (key: string) => void
  scope: string
}
const PAGE_SIZE = 50
const wordText = (value: Word): string => typeof value === 'object' ? `${value.text}${value.mark ? ` ${value.mark.text}` : ''}` : String(value)
const cellText = (cell: Cell): string => typeof cell === 'object' && 'lines' in cell ? cell.lines.map(wordText).join(' ') : wordText(cell)

/** Projection only: local filtering/paging over supplied rows; no acquisition or workflow commands. */
export function LedgerGrid({ table, selected, onSelect, scope }: LedgerGridProps) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState(-1)
  const [descending, setDescending] = useState(false)
  const [page, setPage] = useState(0)
  const rows = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase()
    const matching = table.rows.filter(row => !query || `${row.key} ${row.cells.map(cellText).join(' ')}`.toLocaleLowerCase().includes(query))
    if (sort < 0) return matching
    return [...matching].sort((a, b) => {
      const left = a.cells[sort], right = b.cells[sort]
      const result = typeof left === 'number' && typeof right === 'number' ? left - right : cellText(left ?? '').localeCompare(cellText(right ?? ''), undefined, { numeric: true })
      return (descending ? -result : result) || a.key.localeCompare(b.key)
    })
  }, [table, filter, sort, descending])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  return <section aria-label="Ledger grid" className="ledger-grid" style={{ minWidth: 0 }}>
    <p>Scope: {scope}. Supplied rows: {table.rows.length}. Source completeness is not asserted.</p>
    <div className="ledger-controls">
      <label>Filter supplied rows <input value={filter} onChange={e => { setFilter(e.target.value); setPage(0) }} /></label>
      <label>Sort column <select value={sort} onChange={e => { setSort(Number(e.target.value)); setPage(0) }}><option value={-1}>Source order</option>{table.head?.map((head, i) => <option key={i} value={i}>{head.label}</option>)}</select></label>
      <button disabled={sort < 0} aria-pressed={descending} onClick={() => setDescending(!descending)}>Descending</button>
    </div>
    <p>Sort uses displayed values; no unit conversion or aggregation.</p>
    <p role="status">Showing {rows.length ? current * PAGE_SIZE + 1 : 0}–{Math.min((current + 1) * PAGE_SIZE, rows.length)} of {rows.length} matching rows · Page {current + 1} of {pages} · At most {PAGE_SIZE} rendered rows.</p>
    {selected && !shown.some(row => row.key === selected) && <p>Selected object is outside this page or filter. Selection retained: {selected}</p>}
    <div role="region" aria-label="Scrollable ledger table" tabIndex={0} className="ledger-scroll" style={{ overflowX: 'auto', maxWidth: '100%' }}><CardView body={[{ ...table, rows: shown, selected }]} open={onSelect} /></div>
    <nav aria-label="Ledger pages"><button disabled={current === 0} onClick={() => setPage(current - 1)}>Previous page</button><button disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>Next page</button></nav>
  </section>
}

/** Observation-specific details; cell values come from the same public reading projection as the grid. */
export function LedgerEvidence({ snapshot, context }: { snapshot: ObservationSnapshot; context: ObservationContext }) {
  const key = pathKey(context.selected)
  const table = readingView.present(snapshot, context).flatMap(panel => panel.blocks).find((block): block is Table => block.kind === 'table')
  const row = table?.rows.find(item => item.key === key)
  const object = objectsIn(snapshot.content.tree).find(item => pathKey(item.path) === key)
  const reads = snapshot.evidence[key] ?? []
  return <section aria-label="Ledger object evidence">
    <h2>Object evidence</h2><p className="ledger-path">Selected: {key || '(root)'}</p>
    <CardView body={[{ kind: 'facts', rows: [
      { label: 'Snapshot ID', value: snapshot.id }, { label: 'Captured at', value: snapshot.capturedAt },
      { label: 'Context time', value: context.at }, { label: 'Source mode', value: snapshot.provenance },
      ...(row?.cells.map((value, i) => ({ label: table?.head?.[i]?.label ?? `Column ${i + 1}`, value })) ?? []),
      ...(object?.place.meter ? [{ label: 'Raw value / capacity', value: `${object.place.meter.used ?? 'unknown'} / ${object.place.meter.of ?? 'unknown'} ${object.place.meter.unit}` }] : []),
    ] }]} />
    {!object && <p>Object is not represented in this snapshot. Selection retained.</p>}
    {object && !row && <p>This object has no row in the selected reading projection.</p>}
    {!reads.length && <p>Source or measurement time is not supplied. Unknown.</p>}
    {reads.map((read, i) => <details key={read.source + i} open><summary>{read.outcome} · {read.source}</summary><CardView body={[{ kind: 'facts', rows: [
      { label: 'Source', value: read.source }, { label: 'Outcome', value: read.outcome },
      { label: 'Evaluation time', value: read.evaluatedAt ?? 'Unknown (not scrape time)' },
      { label: 'Received at', value: read.receivedAt }, { label: 'Refresh deadline', value: read.expiresAt ?? 'Not supplied' },
      { label: 'Detail', value: read.detail ?? 'Not supplied' },
    ] }]} /></details>)}
  </section>
}
