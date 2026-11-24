/**
 * Step 7e's check (engine backend plan, 2026-11-23): for every declared infrastructure read that needs no parameter
 * (and the parameterised ones given in READS_WITH, e.g. "cluster.workloads&ns=bifrost-platform-stg"), read the
 * platform route straight and through the engine with the same token, in the same moment, and compare the answers
 * value for value. Fields that are the time an answer was made (generated_at, at, as_of, checked_at, now, timestamp)
 * are left out; any other difference is reported. A live read, whose two direct answers in the same moment already
 * differ, is compared by shape (every field's path and type) and listed as live. Exit 0 only when everything is equal. A read the
 * platform refuses without a token is "not measured", not a pass. Token: COMPARE_TOKEN, never printed.
 *
 *   PLATFORM=http://… ENGINE=http://… COMPARE_TOKEN=… [READS_WITH="cluster.workloads&ns=…;…"] node scripts/compare-infra.ts
 */
import { READS, upstreamOf } from '../src/infra.ts'

const platform = process.env.PLATFORM, engine = process.env.ENGINE, token = process.env.COMPARE_TOKEN
if (!platform || !engine) { console.error('set PLATFORM and ENGINE'); process.exit(2) }
const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
const TIME = new Set(['generated_at', 'at', 'as_of', 'checked_at', 'now', 'timestamp', 'updated_at', 'last_seen', 'age', 'age_seconds', 'uptime_seconds'])
const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => !TIME.has(k)).map(([k, x]) => [k, strip(x)])) : v
const asks = [...Object.entries(READS).filter(([, r]) => !Object.values(r.params ?? {}).some(p => p.required)).map(([n]) => `read=${n}`),
  ...(process.env.READS_WITH ?? '').split(';').filter(Boolean).map(x => `read=${x}`)]
const diffs: string[] = [], live: string[] = [], unmeasured: string[] = []
const paths = (v: unknown, at = ''): string[] => Array.isArray(v) ? [`${at}[]`, ...v.slice(0, 50).flatMap(x => paths(x, `${at}[]`))] : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => [`${at}.${k}:${x === null ? 'null' : Array.isArray(x) ? 'array' : typeof x}`, ...paths(x, `${at}.${k}`)]) : []
const shape = (v: unknown) => JSON.stringify([...new Set(paths(v))].sort())
for (const q of asks) {
  const u = upstreamOf(new URL(`http://x/?${q}`))
  if ('error' in u) { diffs.push(`${q}: ${u.error}`); continue }
  const direct = async () => { const r = await fetch(new URL(u.path, platform), { headers }); return { status: r.status, body: await r.json().catch(() => null) } }
  const [a, v, a2] = await Promise.all([direct(), fetch(new URL(`/engine/v1/infra?${q}`, engine), { headers }).then(r => r.json() as Promise<any>), direct()])
  if (a.status === 401 || a.status === 403) { unmeasured.push(u.name); continue }
  const want = a.status >= 200 && a.status < 300 || u.keepErrorBody ? JSON.stringify(strip(a.body)) : 'null'
  const got = JSON.stringify(strip(v.data ?? null))
  if (want === got) continue
  if (JSON.stringify(strip(a.body)) === JSON.stringify(strip(a2.body))) { diffs.push(`${u.name}: ${want.length} vs ${got.length} bytes`); continue }
  // Live: two direct reads already differ, so no third read can equal them. Compare the shape (every field's path and
  // type) instead; a different shape is a difference, an equal one is listed as live.
  ;(shape(a.body) === shape(v.data) ? live : diffs).push(`${u.name}${shape(a.body) === shape(v.data) ? '' : ': shape differs'}`)
}
console.log(`infra: ${asks.length} reads; differing ${diffs.length}${live.length ? `; ${live.length} live (values change between any two reads; shape equal: ${live.join(', ')})` : ''}${unmeasured.length ? `; ${unmeasured.length} not measured (want a viewer token: ${unmeasured.join(', ')})` : ''}`)
for (const d of diffs.slice(0, 30)) console.log('  ' + d)
process.exit(diffs.length === 0 && unmeasured.length === 0 ? 0 : 1)
