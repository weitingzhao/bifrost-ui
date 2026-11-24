/**
 * Step 4's check (engine backend plan, 2026-11-23): for the same stretch of time (WINDOW_S, default 120 s), read the
 * bus stream straight from the platform and the engine's traffic stream with the same token, and compare the trips one
 * by one: each delivery (event > reader), its type, and its two ends (from the topic's domain, to the reader's). The
 * direct side applies the same rule (src/traffic.ts tripOf) to the direct contract and stream, under the same reader
 * name as the engine (the Console's, so no new reader joins the bus). Trips in the first and last few seconds may fall
 * on one side only (the two streams open a moment apart); those are reported apart and do not fail the check. Exit 0
 * only when the rest is equal and at least one trip was seen (no traffic is "not measured", not a pass). The token
 * comes from the environment (COMPARE_TOKEN) and is never printed.
 *
 *   PLATFORM=http://… ENGINE=http://… COMPARE_TOKEN=… [WINDOW_S=120] node scripts/compare-traffic.ts
 */
import { CONTRACT, STREAM, tripOf, type BusContract, type Trip } from '../src/traffic.ts'
import { SseParser } from '../src/sse.ts'

const platform = process.env.PLATFORM, engine = process.env.ENGINE, token = process.env.COMPARE_TOKEN
const windowMs = Number(process.env.WINDOW_S ?? 120) * 1000, EDGE_MS = 5000
if (!platform || !engine) { console.error('set PLATFORM and ENGINE'); process.exit(2) }
const auth: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
const stop = AbortSignal.timeout(windowMs)
const t0 = Date.now()

async function each(url: URL, onMessage: (m: { id?: string; event?: string; data: string }) => void) {
  try {
    const r = await fetch(url, { headers: { ...auth, accept: 'text/event-stream' }, signal: stop })
    if (!r.ok || !r.body) { console.error(`${url.pathname}: HTTP ${r.status}`); return }
    const p = new SseParser(), d = new TextDecoder(), reader = r.body.getReader()
    for (;;) { const { value, done } = await reader.read(); if (done) return; for (const m of p.push(d.decode(value, { stream: true })).messages) onMessage(m) }
  } catch (e) { if (!stop.aborted) console.error(`${url.pathname}: ${e instanceof Error ? e.message : e}`) }
}

const contract = await fetch(new URL(CONTRACT, platform), { headers: auth }).then(r => r.ok ? r.json() as Promise<BusContract> : null)
const direct = new Map<string, Trip & { seenAt: number }>(), via = new Map<string, Trip & { seenAt: number }>()
const types = new Map<string, string>()
await Promise.all([
  each(new URL(`${STREAM}?client=console&receipts=1`, platform), m => {
    let b: any; try { b = JSON.parse(m.data) } catch { return }
    if (m.event !== 'rcpt') { if (b.id && b.type) types.set(b.id, b.type); return }
    const t = tripOf(contract, id => types.get(id), b)
    if (t) direct.set(`${t.communication}@${t.at}`, { ...t, seenAt: Date.now() - t0 })
  }),
  each(new URL('/engine/v1/traffic', engine), m => {
    if (m.event === 'trip') { const t = JSON.parse(m.data) as Trip; via.set(`${t.communication}@${t.at}`, { ...t, seenAt: Date.now() - t0 }) }
    if (m.event === 'state') { const s = JSON.parse(m.data); if (s.connection !== 'live') console.error(`engine stream: ${s.connection} ${s.detail ?? ''}`) }
  }),
])
const edge = (t: { seenAt: number }) => t.seenAt < EDGE_MS || t.seenAt > windowMs - EDGE_MS
const diffs: string[] = [], edges: string[] = []
for (const k of new Set([...direct.keys(), ...via.keys()])) {
  const a = direct.get(k), b = via.get(k)
  if (!a || !b) { ((a ?? b)! && edge((a ?? b)!) ? edges : diffs).push(`${k}: only ${a ? 'direct' : 'engine'}`); continue }
  if (a.type !== b.type || a.from !== b.from || a.to !== b.to) diffs.push(`${k}: ${a.type} ${a.from}→${a.to} vs ${b.type} ${b.from}→${b.to}`)
}
console.log(`traffic over ${windowMs / 1000} s: direct ${direct.size} trips, engine ${via.size}; differing ${diffs.length}; at the window's edges ${edges.length}`)
for (const d of [...diffs, ...edges].slice(0, 30)) console.log('  ' + d)
if (direct.size === 0 && via.size === 0) { console.log('no traffic in the window: not measured'); process.exit(1) }
process.exit(diffs.length === 0 ? 0 : 1)
