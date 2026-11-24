/**
 * Step 6's check (engine backend plan, 2026-11-23): within the same minute, read every pipeline's retained runs (and,
 * for the newest run of each, its record) straight from the platform and through the engine with the same token,
 * build the direct reports with the same projections (src/report.ts), and compare panels and objects item by item
 * (the report id and capture time differ by design and are left out). A pipeline whose runs changed between the two
 * reads asks for a rerun. Exit 0 only when everything is equal. Token: COMPARE_TOKEN from the environment, never printed.
 *
 *   PLATFORM=http://… ENGINE=http://… COMPARE_TOKEN=… [PIPELINES=a,b] node scripts/compare-report.ts
 */
import { pipelineReport, runReport, timingsPath, type ObservationReport } from '../src/report.ts'

const platform = process.env.PLATFORM, engine = process.env.ENGINE, token = process.env.COMPARE_TOKEN
if (!platform || !engine) { console.error('set PLATFORM and ENGINE'); process.exit(2) }
const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
const read = async (base: string, path: string) => { const r = await fetch(new URL(path, base), { headers }); return r.ok ? r.json() as Promise<any> : null }
const names: string[] = process.env.PIPELINES ? process.env.PIPELINES.split(',') : ((await read(platform, '/api/v1/delivery/pipelines'))?.pipelines ?? []).map((p: { name: string }) => p.name)
if (names.length === 0) { console.error('no pipelines read'); process.exit(1) }
// The rows that differ between two times the source was asked are not the engine's doing: compare what both say.
const body = (r: ObservationReport) => JSON.stringify({ scope: r.scope, panels: r.panels, objects: Object.fromEntries(Object.entries(r.objects).map(([k, v]) => [k, { label: v.label, blocks: v.blocks }])) })
const diffs: string[] = [], moved: string[] = [], unmeasured: string[] = []
let runs = 0
for (const p of names) {
  const [d, v] = await Promise.all([read(platform, `/api/v1/delivery/pipelines/${encodeURIComponent(p)}/runs`), read(engine, `/engine/v1/report?kind=pipeline&pipeline=${encodeURIComponent(p)}`)])
  if (!d?.runs || !v?.data) { diffs.push(`${p}: ${!d?.runs ? 'direct' : 'engine'} read failed`); continue }
  const want = pipelineReport(d, v.data.capturedAt)
  if (body(want) !== body(v.data)) (d.generated_at !== v.data.evidence[0].evaluatedAt ? moved : diffs).push(`${p}: run list`)
  const newest = d.runs[0]?.name
  if (!newest) continue
  runs++
  const [dt, vt] = await Promise.all([read(platform, timingsPath(p, newest)), read(engine, `/engine/v1/report?kind=run&pipeline=${encodeURIComponent(p)}&run=${encodeURIComponent(newest)}`)])
  if (!dt?.runs && /refused your token/.test(vt?.evidence?.[0]?.detail ?? '')) { unmeasured.push(`${p}/${newest}`); continue }
  if (!dt?.runs || !vt?.data) { diffs.push(`${p}/${newest}: ${!dt?.runs ? 'direct' : 'engine'} read failed${vt?.evidence ? ': ' + vt.evidence[0].detail : ''}`); continue }
  let wantRun: ObservationReport
  try { wantRun = runReport(dt, p, newest, vt.data.capturedAt) } catch (e) { diffs.push(`${p}/${newest}: direct ${e instanceof Error ? e.message : e}`); continue }
  if (body(wantRun) !== body(vt.data)) (dt.as_of !== vt.data.evidence[0].evaluatedAt ? moved : diffs).push(`${p}/${newest}: run record`)
}
console.log(`reports: ${names.length} pipelines, ${runs} newest runs; differing ${diffs.length}${moved.length ? `; ${moved.length} changed between the reads, rerun` : ''}${unmeasured.length ? `; ${unmeasured.length} run records not measured (the platform wants a viewer token for them)` : ''}`)
for (const d of [...diffs, ...moved].slice(0, 30)) console.log('  ' + d)
process.exit(diffs.length === 0 && moved.length === 0 && unmeasured.length === 0 ? 0 : 1)
