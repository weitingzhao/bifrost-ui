import { ENV, INT, NAME, NS, type Reads } from './allowlist.ts'

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
export const READS: Reads = {
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

