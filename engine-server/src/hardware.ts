import { readFileSync } from 'node:fs'
import { envelope, type Envelope, type ReadEvidence } from './envelope.ts'
import { readAs, type Upstream } from './upstream.ts'

/**
 * Step 2 (engine backend plan, 2026-11-23; 箭10 2026-11-24): the hardware, read once here instead of by every view
 * (promql had four readers, topology two, alerts two: City's hardware district and unit rooms, Signals and the
 * hardware evidence page). Three kinds of platform read, all with the viewer's token:
 *   GET /api/v1/topology?env=prod             the devices the platform knows
 *   GET /api/v1/telemetry/promql?q=…          one per query in config/hardware-queries.json (the readings' sources)
 *   GET /api/v1/telemetry/alerts              what monitoring has firing
 * The engine judges nothing. What it adds is the one join every view did for itself: which device each reading and
 * each alert belongs to (by cluster node, by address, by host name, as City's deviceOf does). A point that matches no
 * device is kept, unattached, never dropped; a failed read is an error with its reason, never an empty list.
 */
export const QUERIES: Record<string, string> = JSON.parse(readFileSync(new URL('../config/hardware-queries.json', import.meta.url), 'utf8'))
export const TOPOLOGY = '/api/v1/topology?env=prod'
export const ALERTS = '/api/v1/telemetry/alerts'
export const queryPath = (q: string) => '/api/v1/telemetry/promql?q=' + encodeURIComponent(q)

export type TopoNode = { id: string; label?: string; group?: string; host?: string; in_k3s_cluster?: boolean; compose_roles?: string[]; k3s_roles?: string[]; [more: string]: unknown }
export type PromPoint = { labels?: Record<string, string>; value: number; timestamp?: number }
export type PromAlert = { labels: Record<string, string>; annotations?: Record<string, string>; state: string; active_at?: string; [more: string]: unknown }

/** A device's keys: its address (not loopback) and the cluster node whose internal IP it is. */
export type DeviceKey = { id: string; ip: string | null; node: string | null }
/** One reading: which query, its labels, its value, and where it was read (the PromQL). */
export type Reading = { query: string; source: string; labels: Record<string, string>; value: number; timestamp?: number }

export type Hardware = {
  /** The platform's answers as they came (null: that read failed; its evidence says why). */
  topology: TopoNode[] | null
  prom: Record<string, PromPoint[] | null>
  alerts: PromAlert[] | null
  /** The join: every device with its keys, its readings and its alerts. */
  devices: (DeviceKey & { readings: Reading[]; alerts: PromAlert[] })[]
  /** Readings and alerts that name no device the topology has. */
  unattached: { readings: Reading[]; alerts: PromAlert[] }
  /** The queries asked, by key: the source each reading names. */
  queries: Record<string, string>
}

export function deviceKeys(topology: readonly TopoNode[], nodeIp: readonly PromPoint[] | null): DeviceKey[] {
  const nodeOfIp = new Map((nodeIp ?? []).map(p => [p.labels?.internal_ip ?? '', p.labels?.node ?? '']))
  return topology.map(n => {
    const ip = n.host && n.host !== '127.0.0.1' ? n.host : null
    return { id: n.id, ip, node: ip ? nodeOfIp.get(ip) || null : null }
  })
}

const addressOf = (instance: string | undefined) => instance?.replace(/:\d+$/, '') ?? ''

/** The device a set of labels names, exactly, or null (City's deviceOf, the same rule). */
export function deviceOf(labels: Record<string, string>, devices: readonly DeviceKey[]): string | null {
  // In a namespace the labels are about a workload: its instance is only the target scraped; its node places it.
  const ip = labels.namespace ? '' : addressOf(labels.instance) || labels.internal_ip || ''
  const host = (labels.host ?? '').toLowerCase()
  return devices.find(x => (labels.node && x.node === labels.node) || (ip && x.ip === ip) || (host && x.id.toLowerCase() === host))?.id ?? null
}

/** When a PromQL answer was evaluated: the oldest point's timestamp, when every point has one. */
const evaluatedOf = (points: readonly PromPoint[]): string | undefined => {
  const t = points.map(p => p.timestamp).filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
  return points.length > 0 && t.length === points.length ? new Date(Math.min(...t) * 1000).toISOString() : undefined
}
/** Two missed 30-second reads make the display stale (not the hardware unhealthy). */
const STALE_MS = 60_000
const expiry = (e: ReadEvidence): ReadEvidence =>
  ({ ...e, expiresAt: new Date(Math.min(Date.parse(e.receivedAt), e.evaluatedAt ? Date.parse(e.evaluatedAt) : Infinity) + STALE_MS).toISOString() })

export async function readHardware(up: Upstream, authorization: string | undefined): Promise<Envelope<Hardware>> {
  const keys = Object.keys(QUERIES)
  const [topo, alerts, ...prom] = await Promise.all([
    readAs<{ nodes?: TopoNode[] }>(up, TOPOLOGY, authorization),
    readAs<{ alerts?: PromAlert[] }>(up, ALERTS, authorization),
    ...keys.map(k => readAs<{ points?: PromPoint[] }>(up, queryPath(QUERIES[k]), authorization)),
  ])
  const evidence: ReadEvidence[] = []
  // An answer without its list says nothing about what it lists: an error, not "none".
  const listOf = <T>(r: { evidence: ReadEvidence; body: unknown }, field: string, source: string): T[] | null => {
    const e = { ...r.evidence, source }
    const list = r.evidence.outcome === 'read' ? (r.body as Record<string, unknown> | null)?.[field] : undefined
    if (r.evidence.outcome === 'read' && !Array.isArray(list)) { evidence.push(expiry({ ...e, outcome: 'error', detail: `incomplete answer: no ${field} list` })); return null }
    const out = Array.isArray(list) ? (list as T[]) : null
    const evaluatedAt = field === 'points' && out ? evaluatedOf(out as PromPoint[]) : undefined
    evidence.push(expiry({ ...e, ...(out && field === 'points' && out.length === 0 ? { outcome: 'missing', detail: 'the query returned no series' } : {}), ...(evaluatedAt ? { evaluatedAt } : {}) }))
    return out
  }
  const topology = listOf<TopoNode>(topo, 'nodes', TOPOLOGY)
  const alertList = listOf<PromAlert>(alerts, 'alerts', ALERTS)
  const promOut: Hardware['prom'] = Object.fromEntries(keys.map((k, i) => [k, listOf<PromPoint>(prom[i], 'points', queryPath(QUERIES[k]))]))
  if (topology === null) return envelope<Hardware>('hardware', evidence, null)

  const dk = deviceKeys(topology, promOut.nodeIp ?? null)
  const devices: Hardware['devices'] = dk.map(d => ({ ...d, readings: [], alerts: [] }))
  const byId = new Map(devices.map(d => [d.id, d]))
  const unattached: Hardware['unattached'] = { readings: [], alerts: [] }
  for (const k of keys) for (const p of promOut[k] ?? []) {
    const labels = p.labels ?? {}
    const r: Reading = { query: k, source: QUERIES[k], labels, value: p.value, ...(p.timestamp != null ? { timestamp: p.timestamp } : {}) }
    const at = deviceOf(labels, dk)
    ;(at ? byId.get(at)!.readings : unattached.readings).push(r)
  }
  for (const a of alertList ?? []) {
    const at = deviceOf(a.labels ?? {}, dk)
    ;(at ? byId.get(at)!.alerts : unattached.alerts).push(a)
  }
  return envelope('hardware', evidence, { topology, prom: promOut, alerts: alertList, devices, unattached, queries: QUERIES })
}
