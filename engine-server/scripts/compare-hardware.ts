/**
 * Step 2's check (engine backend plan, 2026-11-23): within the same minute, read the hardware straight from the platform
 * (topology, every query in config/hardware-queries.json, alerts) and through the engine with the same token, and
 * compare item by item: the devices; per query, every series (its labels) and its value; per device, which readings
 * and alerts it got; the alerts. A value read at two different evaluation times may differ (a rate moved); that is
 * counted apart and asks for a rerun, not a pass. Exit 0 only when everything is equal. The token comes from the
 * environment of whoever runs it (COMPARE_TOKEN) and is never printed: run it in the Console's network after deploy,
 * as the viewer.
 *
 *   PLATFORM=http://… ENGINE=http://… COMPARE_TOKEN=… node scripts/compare-hardware.ts
 */
import { ALERTS, QUERIES, TOPOLOGY, deviceKeys, deviceOf, queryPath, type PromAlert, type PromPoint, type TopoNode } from '../src/hardware.ts'

const platform = process.env.PLATFORM, engine = process.env.ENGINE, token = process.env.COMPARE_TOKEN
if (!platform || !engine) { console.error('set PLATFORM and ENGINE'); process.exit(2) }
const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
const read = async (path: string) => { const r = await fetch(new URL(path, platform), { headers }); return r.ok ? r.json() as Promise<any> : null }
const keys = Object.keys(QUERIES)
const [topo, alerts, via, ...prom] = await Promise.all([
  read(TOPOLOGY), read(ALERTS),
  fetch(new URL('/engine/v1/hardware', engine), { headers }).then(r => r.json() as Promise<any>),
  ...keys.map(k => read(queryPath(QUERIES[k]))),
])
if (!topo?.nodes) { console.error('direct topology read failed'); process.exit(1) }
if (!via.data) { console.error(`engine read: ${JSON.stringify(via.evidence)}`); process.exit(1) }

const diffs: string[] = [], moved: string[] = []
const ser = (l: Record<string, string> | undefined) => JSON.stringify(Object.entries(l ?? {}).sort())
const nodes = topo.nodes as TopoNode[]
if (JSON.stringify(nodes.map(n => n.id).sort()) !== JSON.stringify(via.data.topology.map((n: TopoNode) => n.id).sort())) diffs.push('devices differ')
keys.forEach((k, i) => {
  const a = new Map<string, PromPoint>(((prom[i]?.points ?? null) as PromPoint[] | null ?? []).map(p => [ser(p.labels), p]))
  const b = new Map<string, PromPoint>(((via.data.prom[k] ?? []) as PromPoint[]).map(p => [ser(p.labels), p]))
  for (const s of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(s), y = b.get(s)
    if (!x || !y) { diffs.push(`${k}: series ${s} only ${x ? 'direct' : 'engine'}`); continue }
    if (x.value !== y.value) (x.timestamp !== y.timestamp ? moved : diffs).push(`${k} ${s}: ${x.value} vs ${y.value}`)
  }
})
// The join, done the same way on the direct reads, device by device.
const dk = deviceKeys(nodes, prom[keys.indexOf('nodeIp')]?.points ?? null)
for (const d of via.data.devices as { id: string; readings: { query: string; labels: Record<string, string> }[]; alerts: PromAlert[] }[]) {
  const want = keys.flatMap((k, i) => ((prom[i]?.points ?? []) as PromPoint[]).filter(p => deviceOf(p.labels ?? {}, dk) === d.id).map(p => `${k} ${ser(p.labels)}`)).sort()
  const got = d.readings.map(r => `${r.query} ${ser(r.labels)}`).sort()
  if (JSON.stringify(want) !== JSON.stringify(got)) diffs.push(`${d.id}: readings ${got.length} via engine, ${want.length} direct`)
  const wantA = ((alerts?.alerts ?? []) as PromAlert[]).filter(a => deviceOf(a.labels ?? {}, dk) === d.id).map(a => ser(a.labels)).sort()
  if (JSON.stringify(wantA) !== JSON.stringify(d.alerts.map(a => ser(a.labels)).sort())) diffs.push(`${d.id}: alerts differ`)
}
const aa = ((alerts?.alerts ?? []) as PromAlert[]).map(a => ser(a.labels)).sort(), ba = ((via.data.alerts ?? []) as PromAlert[]).map(a => ser(a.labels)).sort()
if (JSON.stringify(aa) !== JSON.stringify(ba)) diffs.push(`alerts: ${aa.length} direct, ${ba.length} via engine`)

console.log(`hardware: ${nodes.length} devices, ${keys.length} queries; differing ${diffs.length}${moved.length ? `; ${moved.length} values moved between evaluations, rerun` : ''}`)
for (const d of [...diffs, ...moved].slice(0, 30)) console.log('  ' + d)
process.exit(diffs.length === 0 && moved.length === 0 ? 0 : 1)
