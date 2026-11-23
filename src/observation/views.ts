import type { Block } from '../city/cards'
import { meterText, type State } from '../city/places'
import { statusOfQuality, statusOfState } from '../city/world'
import { objectsIn, pathKey, readQuality, type ObservationView, type ObservationLayer } from './model'

/**
 * A table cell in the engine's seven words, the source's own word beside it and in the hover (箭10 2026-11-23, brand
 * layer item 5; the same tables Signals' evidence buttons use, 9ba3600). A reported state: statusOfState. A reading's
 * quality: fresh is ok, past its deadline fail, anything else unknown.
 */
const said = (word: ReturnType<typeof statusOfState>, raw: string) => ({ text: word === raw ? word : `${word} · ${raw}`, tone: word, title: raw })
const stateCell = (s: State | undefined) => said(statusOfState(s), s ?? 'unknown')
const qualityCell = (q: string) => said(statusOfQuality(q) ?? 'ok', q)

const selectedRows: ObservationView['present'] = (s, c) => {
  const rows = objectsIn(s.content.tree).filter(r => r.place.kind === 'room' || r.place.state)
  return [{ id: 'readings', label: 'Readings', blocks: [{ kind: 'table', head: ['Object', 'Reported state', ...(c.metrics ? ['Measurement'] : []), 'Read quality'].map(label => ({ label })), rows: rows.map(r => ({ key: pathKey(r.path), open: pathKey(r.path), cells: [r.place.label, stateCell(r.place.state), ...(c.metrics ? [meterText(r.place.meter) ?? 'Not measured'] : []), qualityCell(readQuality(s.evidence[pathKey(r.path)] ?? [], c.at))], title: pathKey(r.path) })), empty: 'No observed objects' }] }]
}
export const readingView: ObservationView = { id: 'readings', label: 'Readings', present: selectedRows }
export const statusView: ObservationView = { id: 'status', label: 'Status field', present: (s, c) => objectsIn(s.content.tree)
  .filter(r => r.place.kind === 'building').map(r => ({ id: pathKey(r.path), label: r.place.label, blocks: [
    { kind: 'table', head: [{ label: 'Object' }, { label: 'Reported state' }], rows: [{ key: pathKey(r.path), open: pathKey(r.path), cells: [r.place.label, stateCell(r.place.state)] }] },
    ...(c.metrics ? [{ kind: 'table', head: [{ label: 'Resource' }, { label: 'Measurement' }], rows: r.place.children.map(p => ({ key: pathKey([...r.path, p.id]), open: pathKey([...r.path, p.id]), cells: [p.label, meterText(p.meter) ?? 'Not measured'] })) } as Block] : []),
    { kind: 'note', text: readQuality(s.evidence[pathKey(r.path)] ?? [], c.at) },
  ] })) }
export const anomalyLayer: ObservationLayer = { id: 'anomalies', label: 'Reported alerts', present: (s, c) => {
  const a = s.content.alerts
  return [{ id: 'alerts', label: 'Monitoring judgments', blocks: a?.alerts ? [{ kind: 'note', text: readQuality(s.evidence['@alerts'] ?? [], c.at) }, { kind: 'table', head: ['Rule', 'Severity', 'Object', 'Since'].map(label => ({ label })), rows: a.alerts.map(x => ({ key: x.id, cells: [x.name, x.severity, x.at ? pathKey(x.at) : 'Unplaced — no identity evidence', x.since ?? 'Unknown'], title: x.summary })), empty: 'No firing alerts returned; this is not a health verdict' }, { kind: 'note', text: a.source }] : [{ kind: 'note', text: a ? a.why : 'Alerts not connected' }] }]
} }
