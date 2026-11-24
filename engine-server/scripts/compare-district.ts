/**
 * Step 3's check (engine backend plan, 2026-11-23): within the same minute, read the tech tree and every domain's
 * holdings straight from the platform and through the engine with the same token, and compare item by item: the
 * tree's domains (package counts) and edges (imports, wrong way); for each domain its buildings (ids, package lists)
 * and the building edges (the same roll-up done on the direct reads). The graph's commit must match on both sides
 * (a new main between the reads asks for a rerun). Exit 0 only when everything is equal. The token comes from the
 * environment (COMPARE_TOKEN; these reads want a viewer token) and is never printed.
 *
 *   PLATFORM=http://… ENGINE=http://… COMPARE_TOKEN=… [REPO=bifrost-platform] node scripts/compare-district.ts
 */
import { buildingImports, CI_DOMAINS, DEFAULT_REPO, DOMAIN, type CiDomainGraph, type DomainHoldings } from '../src/district.ts'

const platform = process.env.PLATFORM, engine = process.env.ENGINE, token = process.env.COMPARE_TOKEN, repo = process.env.REPO ?? DEFAULT_REPO
if (!platform || !engine) { console.error('set PLATFORM and ENGINE'); process.exit(2) }
const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
const read = async (base: string, path: string) => { const r = await fetch(new URL(path, base), { headers }); return { status: r.status, body: await r.json().catch(() => null) as any } }

const [g, gv] = await Promise.all([read(platform, `${CI_DOMAINS}?repo=${repo}`), read(engine, `/engine/v1/techtree?repo=${repo}`)])
if (g.status !== 200) { console.error(`direct tree read: HTTP ${g.status}`); process.exit(1) }
if (!gv.body?.data) { console.error(`engine tree read: ${JSON.stringify(gv.body?.evidence)}`); process.exit(1) }
const graph = g.body as CiDomainGraph, via = gv.body.data as CiDomainGraph
const diffs: string[] = []
if (graph.commit !== via.commit) { console.log(`tree: main moved between the reads (${graph.commit} vs ${via.commit}), rerun`); process.exit(1) }
const key = (xs: unknown[]) => JSON.stringify(xs.map(x => JSON.stringify(x)).sort())
if (key(graph.domains.map(d => [d.id, d.packages])) !== key(via.domains.map(d => [d.id, d.packages]))) diffs.push('tree: domains or their package counts differ')
if (key(graph.edges.map(e => [e.from, e.to, e.imports, e.wrong_way])) !== key(via.edges.map(e => [e.from, e.to, e.imports, e.wrong_way]))) diffs.push('tree: edges differ')

for (const { id } of graph.domains) {
  const [d, dv] = await Promise.all([read(platform, `${DOMAIN}?id=${id}`), read(engine, `/engine/v1/district?id=${id}&repo=${repo}`)])
  if (d.status !== 200) { diffs.push(`${id}: direct read HTTP ${d.status}`); continue }
  if (!dv.body?.data) { diffs.push(`${id}: engine read ${JSON.stringify(dv.body?.evidence?.[0])}`); continue }
  const h = d.body as DomainHoldings, hv = dv.body.data.holdings as DomainHoldings
  if (key((h.buildings ?? []).map(b => [b.id, [...b.packages].sort()])) !== key((hv.buildings ?? []).map(b => [b.id, [...b.packages].sort()]))) diffs.push(`${id}: buildings differ`)
  for (const k of ['packages', 'groups', 'paths', 'workloads', 'tables'] as const) if (key((h[k] ?? []) as unknown[]) !== key((hv[k] ?? []) as unknown[])) diffs.push(`${id}: ${k} differ`)
  const want = buildingImports(h, graph, '')
  if (JSON.stringify(want) !== JSON.stringify(dv.body.data.imports)) diffs.push(`${id}: building edges differ`)
}
console.log(`tree at ${graph.commit.slice(0, 8)}: ${graph.domains.length} domains, ${graph.edges.length} edges; differing ${diffs.length}`)
for (const d of diffs.slice(0, 30)) console.log('  ' + d)
process.exit(diffs.length === 0 ? 0 : 1)
