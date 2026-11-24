import { envelope, type Envelope, type ReadEvidence } from './envelope.ts'
import type { Upstream } from './upstream.ts'

/**
 * Step 7e (engine backend plan, 2026-11-23; 箭10 2026-11-24: the Console's biggest group first): the infrastructure
 * pages' reads (Cluster, Network, IB, self-health, MCP, telemetry overview). The Console's readers for these are thin
 * (an HTTP check and the JSON as it came): no translation to move. So the engine serves them as one declared list:
 * GET /engine/v1/infra?read=<name>&<params> reads exactly that platform route with the viewer's token and answers
 * the envelope with the platform's answer unchanged as data. Only the reads below exist (an allow-list, not a proxy:
 * no path is passed through, every parameter is checked); writes on these pages (scale, restart, ensure, firewall
 * apply, gateway control) are not reads and stay on the platform's front door.
 * A failed read is an error with its reason and no data, except where the page shows the failure's own body (the
 * network reads, the gateway status): there the body comes with the error evidence, as the Console reads it.
 */
type Param = { re: RegExp; required?: boolean }
type Read = { path: string; params?: Record<string, Param>; keepErrorBody?: boolean }

const NS = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
const NAME = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/
const ENV = /^(dev|stg|prod)$/
const INT = (max: number) => new RegExp(`^(?:[1-9]\\d{0,${String(max).length - 1}})$`)

export const READS: Record<string, Read> = {
  'cluster': { path: '/api/v1/cluster' },
  'cluster.nodes': { path: '/api/v1/cluster/nodes' },
  'cluster.node-power': { path: '/api/v1/cluster/nodes/{node}/power', params: { node: { re: NAME, required: true } } },
  'cluster.governance': { path: '/api/v1/cluster/governance' },
  'cluster.service-readiness': { path: '/api/v1/cluster/service-readiness' },
  'cluster.postgres': { path: '/api/v1/cluster/postgres' },
  'cluster.postgres-backup': { path: '/api/v1/cluster/postgres/backup-status' },
  'cluster.redis': { path: '/api/v1/cluster/redis' },
  'cluster.data-freshness': { path: '/api/v1/cluster/data-freshness' },
  'cluster.data-clone-schedule': { path: '/api/v1/cluster/data-clone/schedule' },
  'cluster.placement': { path: '/api/v1/cluster/placement' },
  'cluster.metrics': { path: '/api/v1/cluster/metrics', params: { limit: { re: INT(100) } } },
  'cluster.observability': { path: '/api/v1/cluster/observability' },
  'cluster.namespaces': { path: '/api/v1/cluster/namespaces', params: { watch: { re: /^bifrost$/ } } },
  'cluster.workloads': { path: '/api/v1/cluster/workloads', params: { ns: { re: NS, required: true } } },
  'cluster.events': { path: '/api/v1/cluster/events', params: { ns: { re: NS }, limit: { re: INT(500) } } },
  'cluster.pod-logs': { path: '/api/v1/cluster/workloads/pods/{ns}/{pod}/logs', params: { ns: { re: NS, required: true }, pod: { re: NAME, required: true }, tailLines: { re: INT(5000) } } },
  'network.status': { path: '/api/v1/network/status', keepErrorBody: true },
  'network.audit': { path: '/api/v1/network/audit', keepErrorBody: true },
  'network.devices': { path: '/api/v1/network/devices', keepErrorBody: true },
  'network.clients': { path: '/api/v1/network/clients', keepErrorBody: true },
  'network.anomalies': { path: '/api/v1/network/anomalies', keepErrorBody: true },
  'network.sla': { path: '/api/v1/network/sla', keepErrorBody: true },
  'ib-gateway.status': { path: '/api/v1/plugins/ib-gateway/status', keepErrorBody: true },
  'matrix': { path: '/api/v1/matrix', params: { env: { re: ENV } } },
  'satellite.bus-deep': { path: '/api/v1/satellite/bus-deep', params: { env: { re: ENV } } },
  'context': { path: '/api/v1/context' },
  'self-health': { path: '/api/v1/self-health' },
  'mcp.tools': { path: '/api/v1/mcp/tools' },
  'telemetry.overview': { path: '/api/v1/telemetry/overview', params: { group: { re: /^compute$/ }, ns: { re: NS } } },
  'telemetry.targets': { path: '/api/v1/telemetry/targets', params: { state: { re: /^(up|down|unknown)$/ } } },
}

/** The platform path for a request, or why there is none. Path parameters fill {…}; the rest become the query, in the declared order. */
export function upstreamOf(url: URL): { name: string; path: string; keepErrorBody: boolean } | { error: string } {
  const name = url.searchParams.get('read') ?? ''
  const r = READS[name]
  if (!r) return { error: `read must be one of: ${Object.keys(READS).join(', ')}` }
  for (const k of url.searchParams.keys()) if (k !== 'read' && !(r.params && k in r.params)) return { error: `${name} takes no parameter ${k}` }
  let path = r.path
  const query = new URLSearchParams()
  for (const [k, p] of Object.entries(r.params ?? {})) {
    const v = url.searchParams.get(k)
    if (v == null || v === '') { if (p.required) return { error: `${name} needs ${k}` }; continue }
    if (!p.re.test(v)) return { error: `${k} is not a valid value for ${name}` }
    if (path.includes(`{${k}}`)) path = path.replace(`{${k}}`, encodeURIComponent(v))
    else query.set(k, v)
  }
  const qs = query.toString()
  return { name, path: qs ? `${path}?${qs}` : path, keepErrorBody: !!r.keepErrorBody }
}

export async function readInfra(up: Upstream, authorization: string | undefined, u: { name: string; path: string; keepErrorBody: boolean }, now = () => new Date()): Promise<Envelope<unknown>> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (authorization) headers.authorization = authorization
  const model = `infra:${u.name}`
  let r: Response
  try {
    r = await (up.fetch ?? fetch)(new URL(u.path, up.base), { headers, signal: AbortSignal.timeout(up.timeoutMs ?? 10_000) })
  } catch (e) {
    const why = e instanceof Error ? e.name === 'TimeoutError' ? 'timed out' : e.message : String(e)
    return envelope(model, [{ source: u.path, outcome: 'error', receivedAt: now().toISOString(), detail: `platform unreachable: ${why}` }], null)
  }
  const receivedAt = now().toISOString()
  const body: unknown = await r.json().catch(() => undefined)
  if (r.ok) {
    if (body === undefined) return envelope(model, [{ source: u.path, outcome: 'error', receivedAt, detail: 'the answer is not JSON' }], null)
    return envelope(model, [{ source: u.path, outcome: 'read', receivedAt }], body)
  }
  const ev: ReadEvidence = { source: u.path, receivedAt, outcome: r.status === 404 ? 'missing' : 'error',
    detail: r.status === 401 || r.status === 403 ? `the platform refused your token (HTTP ${r.status})` : `HTTP ${r.status}` }
  return envelope(model, [ev], u.keepErrorBody && body !== undefined ? body : null)
}
