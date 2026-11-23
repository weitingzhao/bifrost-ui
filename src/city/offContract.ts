import type { Block } from './cards'

/**
 * Requests to routes no domain's contract names (the counter room's stage 1, 2026-11-23: a fifth of the platform's
 * real requests, /health, heartbeats, cluster/*, records…). The counters stand where a route's handler package is, and
 * for these the map cannot say which package serves them, so they stand nowhere in the city; the engine lists them on
 * the city's level instead of hiding them or guessing a building (RULES: the mess shown, never hidden; the city level
 * has no Other slot). The content reads them; the engine draws the card. A failed read is not "none".
 */
export type OffContractRoute = { method: string; path: string; perMin: number }
export type OffContractRead =
  | { routes: OffContractRoute[]; contractPerMin: number | null; source: string }
  | { routes?: undefined; source: string; why: string }

/** The share of all measured requests that hit no contract route; null when the contract side was not read. */
export function offContractShare(r: OffContractRead): number | null {
  if (!r.routes || r.contractPerMin == null) return null
  const off = r.routes.reduce((a, x) => a + x.perMin, 0), all = off + r.contractPerMin
  return all > 0 ? off / all : 0
}

const rate = (v: number) => (v < 10 ? v.toFixed(2) : v.toFixed(1))

/** The card's blocks: one line of what it is, then the routes, busiest first. */
export function offContractBlocks(r: OffContractRead): Block[] {
  if (!r.routes) return [{ kind: 'note', text: `Not read: ${r.why || 'no answer'}. A failed read is not "none".`, tone: 'unknown' }]
  const off = r.routes.reduce((a, x) => a + x.perMin, 0), share = offContractShare(r)
  const rows = [...r.routes].sort((a, b) => b.perMin - a.perMin).map(x => ({ key: `${x.method} ${x.path}`, cells: [`${x.method} ${x.path}`, rate(x.perMin)] }))
  return [
    { kind: 'note', text: `${rate(off)} requests a minute${share == null ? '' : ` (${(share * 100).toFixed(0)}% of all measured)`} hit routes no domain's contract names. They stand nowhere in the city: the map cannot say which package serves them. Read from ${r.source}.`, tone: off > 0 ? 'warn' : undefined },
    { kind: 'table', head: [{ label: 'Route' }, { label: 'Req/min', num: true }], rows, empty: 'Every measured request hit a contract route' },
  ]
}
