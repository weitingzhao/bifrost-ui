import { envelope, type Envelope, type ReadEvidence } from './envelope.ts'
import { readAs, type Upstream } from './upstream.ts'

/**
 * Step 3 (engine backend plan, 2026-11-23; 箭10 2026-11-24): the map and the tech tree, read here instead of in City.
 *   GET /engine/v1/techtree?repo=          who imports whom between domains at main (/api/v1/ci/domains), unchanged
 *   GET /engine/v1/district?id=&repo=      what one domain owns (/api/v1/catalog/domain?id=), unchanged, plus the
 *                                           one join City did itself: the imports inside the domain (ci/domains
 *                                           inner, production code) rolled up from packages to the map's buildings
 * The engine judges nothing: which way of a pair is a loop, what goes into Other, how big a building stands are the
 * view's drawing. A read that fails, or an answer without the lists it must have, is an error with its reason.
 */
export const CI_DOMAINS = '/api/v1/ci/domains'
export const DOMAIN = '/api/v1/catalog/domain'
export const DEFAULT_REPO = 'bifrost-platform'

export type PackagePair = { from: string; to: string }
export type CiDomainGraph = {
  version: number; repo: string; commit: string; measured: boolean; note: string; head?: string; refreshing?: boolean; base?: string
  domains: { id: string; packages: number; tier?: number; [more: string]: unknown }[]
  edges: { from: string; to: string; imports: number; wrong_way: boolean; pairs?: PackagePair[] }[]
  shared_packages: string[]
  inner?: { domain: string; imports: number; pairs: PackagePair[] }[]
  [more: string]: unknown
}
export type OwnRow = { path: string; shared?: string[] }
export type DomainHoldings = {
  id: string; repo?: string; commit?: string
  packages: OwnRow[]; groups: OwnRow[]; paths: OwnRow[]; workloads: OwnRow[]; tables?: OwnRow[]
  buildings?: { id: string; packages: string[] }[]
  contract?: Record<string, unknown> | null; note?: string
  [more: string]: unknown
}
/** Imports between a domain's buildings, package pairs rolled up; `read` false says inner was not read, with why. */
export type BuildingImports = { read: true; commit: string; edges: { from: string; to: string; imports: number }[]; outside: number } | { read: false; why: string }
export type District = { holdings: DomainHoldings; imports: BuildingImports }

const SAFE = /^[a-z0-9][a-z0-9_-]{0,63}$/
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)

/** The graph as ci/domains serves it, checked for what a reader needs (CI page's fetchCiDomains, the same test). */
function graphOf(r: { evidence: ReadEvidence; body: unknown }): { evidence: ReadEvidence; graph: CiDomainGraph | null } {
  if (r.evidence.outcome !== 'read') return { evidence: r.evidence, graph: null }
  const v = r.body
  const ok = record(v) && v.version === 1 && typeof v.measured === 'boolean' && Array.isArray(v.domains) && Array.isArray(v.edges) && Array.isArray(v.shared_packages)
    && v.domains.every(d => record(d) && typeof d.id === 'string') && v.edges.every(e => record(e) && typeof e.from === 'string' && typeof e.to === 'string')
  if (!ok) return { evidence: { ...r.evidence, outcome: 'error', detail: 'incomplete answer or a version the engine does not read; who depends on whom is not known' }, graph: null }
  return { evidence: r.evidence, graph: v as CiDomainGraph }
}

export const repoOf = (url: URL): string | null => { const r = url.searchParams.get('repo') ?? DEFAULT_REPO; return SAFE.test(r) ? r : null }

export async function readTechTree(up: Upstream, authorization: string | undefined, repo: string): Promise<Envelope<CiDomainGraph>> {
  const { evidence, graph } = graphOf(await readAs<unknown>(up, `${CI_DOMAINS}?repo=${encodeURIComponent(repo)}`, authorization))
  return envelope('techtree', [{ ...evidence, source: `${CI_DOMAINS}?repo=${repo}` }], graph)
}

/** Packages to buildings, pairs to edges: a pair inside one building, or naming a package no building holds, is not an edge (counted as outside). */
export function buildingImports(h: DomainHoldings, graph: CiDomainGraph | null, why: string): BuildingImports {
  if (!graph) return { read: false, why }
  if (!graph.inner) return { read: false, why: 'ci/domains serves no inner imports here' }
  const of = new Map<string, string>()
  for (const b of h.buildings ?? []) for (const p of b.packages) of.set(p, b.id)
  const w = new Map<string, number>()
  let outside = 0
  for (const p of graph.inner.find(i => i.domain === h.id)?.pairs ?? []) {
    const a = of.get(p.from), b = of.get(p.to)
    if (!a || !b) { outside++; continue }
    if (a === b) continue
    w.set(`${a}\u0000${b}`, (w.get(`${a}\u0000${b}`) ?? 0) + 1)
  }
  const edges = [...w].map(([k, imports]) => { const [from, to] = k.split('\u0000'); return { from, to, imports } }).sort((x, y) => y.imports - x.imports || x.from.localeCompare(y.from) || x.to.localeCompare(y.to))
  return { read: true, commit: graph.commit, edges, outside }
}

export async function readDistrict(up: Upstream, authorization: string | undefined, id: string, repo: string): Promise<Envelope<District>> {
  const [d, g] = await Promise.all([
    readAs<unknown>(up, `${DOMAIN}?id=${encodeURIComponent(id)}`, authorization),
    readAs<unknown>(up, `${CI_DOMAINS}?repo=${encodeURIComponent(repo)}`, authorization),
  ])
  const dEv: ReadEvidence = { ...d.evidence, source: `${DOMAIN}?id=${id}` }
  const { evidence: gEv0, graph } = graphOf(g)
  const gEv = { ...gEv0, source: `${CI_DOMAINS}?repo=${repo}` }
  if (dEv.outcome !== 'read') return envelope<District>('district', [dEv, gEv], null)
  const h = d.body
  const lists = ['packages', 'groups', 'paths', 'workloads'] as const
  if (!record(h) || h.id !== id || !lists.every(k => Array.isArray(h[k]))) return envelope<District>('district', [{ ...dEv, outcome: 'error', detail: `incomplete answer: not ${id}'s holdings (${lists.join(', ')}); what it owns is not known` }, gEv], null)
  const holdings = h as DomainHoldings
  return envelope('district', [dEv, gEv], { holdings, imports: buildingImports(holdings, graph, gEv.detail ?? `ci/domains ${gEv.outcome}`) })
}

export const idOf = (url: URL): string | null => { const id = url.searchParams.get('id'); return id && SAFE.test(id) ? id : null }
