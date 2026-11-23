import { CardView } from '../city/CardView'
import type { Block } from '../city/cards'
import { LedgerGrid } from '../ledger/Ledger'
import { readQuality, type ObservationPanel, type ReadEvidence } from '../observation/model'

/** A supplied report, not a hardware tree, transport, permission or domain verdict. */
export type ObservationReport = {
  version: 1
  id: string
  capturedAt: string
  scope: string
  panels: readonly ObservationPanel[]
  evidence: readonly ReadEvidence[]
  objects: Readonly<Record<string, { label: string; blocks: Block[]; evidence: readonly ReadEvidence[] }>>
}

/** Controlled projection. Selection is an intent; missing objects never silently resolve to another row. */
export function ObservationReportView({ report, selected, onSelect, at, failure }: {
  report?: ObservationReport
  selected: string
  onSelect: (id: string) => void
  at: string
  failure?: ReadEvidence
}) {
  const object = selected && report && Object.prototype.hasOwnProperty.call(report.objects, selected) ? report.objects[selected] : undefined
  return <section aria-label="Observation report">
    {failure && <p role="alert">Read failed: {failure.detail ?? failure.source}. {report ? 'Showing the previous report; its source times are unchanged.' : 'No report is available.'}</p>}
    {!report && !failure && <p role="status">Reading report…</p>}
    {report && <>
      <p>Report: {report.id} · Captured: {report.capturedAt}</p>
      <p>Scope: {report.scope} · {readQuality(report.evidence, at)}</p>
      {report.panels.map(panel => <section key={panel.id} aria-label={panel.label}><h2>{panel.label}</h2>
        {panel.blocks.map((block, i) => block.kind === 'table'
          ? <LedgerGrid key={i} table={block} scope={report.scope} selected={selected} onSelect={onSelect}/>
          : <CardView key={i} body={[block]} open={onSelect}/>)}
      </section>)}
      {selected && <section aria-label="Selected report object"><h2>{object?.label ?? 'Object not represented'}</h2><p>Requested: {selected}</p>
        {!object && <p>The requested object is absent from this report. Selection retained.</p>}
        {object && <><CardView body={object.blocks} open={onSelect}/><p>{readQuality(object.evidence, at)}</p></>}
      </section>}
      <section aria-label="Report source evidence"><h2>Source evidence</h2>
        {(object?.evidence ?? report.evidence).map((read, i) => <CardView key={i} body={[{kind:'facts',rows:[
          {label:'Source',value:read.source},{label:'Outcome',value:read.outcome},
          {label:'Received at',value:read.receivedAt},{label:'Evaluated at',value:read.evaluatedAt ?? 'Unknown'},
          {label:'Expires at',value:read.expiresAt ?? 'Not supplied'},{label:'Detail',value:read.detail ?? 'Not supplied'},
        ]}]}/>)}</section>
    </>}
  </section>
}
