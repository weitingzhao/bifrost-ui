import type { Block } from '../city/cards'
import { meterText } from '../city/places'
import { objectsIn, pathKey, readQuality, type ObservationView, type ObservationLayer } from './model'

const selectedRows: ObservationView['present'] = (s, c) => {
  const rows = objectsIn(s.content.tree).filter(r => r.place.kind === 'room' || r.place.state)
  return [{ id: 'readings', label: 'Readings', blocks: [{ kind: 'table', head: ['Object', 'Reported state', ...(c.metrics ? ['Measurement'] : []), 'Read quality'].map(label => ({ label })), rows: rows.map(r => ({ key: pathKey(r.path), open: pathKey(r.path), cells: [r.place.label, r.place.state ?? 'unknown', ...(c.metrics ? [meterText(r.place.meter) ?? 'Not measured'] : []), readQuality(s.evidence[pathKey(r.path)] ?? [], c.at)], title: pathKey(r.path) })), empty: 'No observed objects' }] }]
}
export const readingView: ObservationView = { id: 'readings', label: 'Readings', present: selectedRows }
export const statusView: ObservationView = { id: 'status', label: 'Status field', present: (s, c) => objectsIn(s.content.tree)
  .filter(r => r.place.kind === 'building').map(r => ({ id: pathKey(r.path), label: r.place.label, blocks: [
    { kind: 'table', head: [{ label: 'Object' }, { label: 'Reported state' }], rows: [{ key: pathKey(r.path), open: pathKey(r.path), cells: [r.place.label, r.place.state ?? 'unknown'] }] },
    ...(c.metrics ? [{ kind: 'table', head: [{ label: 'Resource' }, { label: 'Measurement' }], rows: r.place.children.map(p => ({ key: pathKey([...r.path, p.id]), open: pathKey([...r.path, p.id]), cells: [p.label, meterText(p.meter) ?? 'Not measured'] })) } as Block] : []),
    { kind: 'note', text: readQuality(s.evidence[pathKey(r.path)] ?? [], c.at) },
  ] })) }
export const anomalyLayer: ObservationLayer = { id: 'anomalies', label: 'Reported alerts', present: (s, c) => {
  const a = s.content.alerts
  return [{ id: 'alerts', label: 'Monitoring judgments', blocks: a?.alerts ? [{ kind: 'note', text: readQuality(s.evidence['@alerts'] ?? [], c.at) }, { kind: 'table', head: ['Rule', 'Severity', 'Object', 'Since'].map(label => ({ label })), rows: a.alerts.map(x => ({ key: x.id, cells: [x.name, x.severity, x.at ? pathKey(x.at) : 'Unplaced — no identity evidence', x.since ?? 'Unknown'], title: x.summary })), empty: 'No firing alerts returned; this is not a health verdict' }, { kind: 'note', text: a.source }] : [{ kind: 'note', text: a ? a.why : 'Alerts not connected' }] }]
} }
