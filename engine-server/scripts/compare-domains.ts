export {}
/**
 * Step 1's check (engine backend plan, 2026-11-23): within the same minute, read the domains' lights straight from
 * the platform and through the engine with the same token, and compare every domain's four lights and reasons.
 * Exit 0 only when they are equal. The token comes from the environment of whoever runs it (COMPARE_TOKEN) and is
 * never printed.
 *
 *   PLATFORM=http://… ENGINE=http://… COMPARE_TOKEN=… node scripts/compare-domains.ts
 */
const platform = process.env.PLATFORM, engine = process.env.ENGINE, token = process.env.COMPARE_TOKEN
if (!platform || !engine) { console.error('set PLATFORM and ENGINE'); process.exit(2) }
const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
const [direct, via] = await Promise.all([
  fetch(new URL("/api/v1/catalog/status", platform), { headers }).then(async r => ({ status: r.status, body: (r.ok ? await r.json() : null) as any })),
  fetch(new URL("/engine/v1/domains", engine), { headers }).then(r => r.json() as Promise<any>),
])
if (direct.status !== 200) { console.error(`direct read: HTTP ${direct.status}`); process.exit(1) }
if (!via.data) { console.error(`engine read: ${JSON.stringify(via.evidence)}`); process.exit(1) }
const key = (d: any) => JSON.stringify([d.overall, d.alive, d.interfaces, d.boundary, d.fresh])
const a = new Map<string, string>(direct.body.domains.map((d: any) => [d.id, key(d)]))
const b = new Map<string, string>(via.data.domains.map((d: any) => [d.id, key(d)]))
const diffs = [...new Set([...a.keys(), ...b.keys()])].filter(id => a.get(id) !== b.get(id))
// The scan round can turn between the two reads; then both carry a different `at` and a rerun settles it.
const sameRound = direct.body.at === via.data.at
console.log(`domains: direct ${a.size}, engine ${b.size}, differing ${diffs.length}${diffs.length ? ': ' + diffs.join(', ') : ''}; scan round ${sameRound ? 'same' : `differs (${direct.body.at} vs ${via.data.at}), rerun`}`)
process.exit(diffs.length === 0 && sameRound ? 0 : 1)
