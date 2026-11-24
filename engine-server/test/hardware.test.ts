import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'
import { QUERIES, queryPath } from '../src/hardware.ts'

// Origin: engine backend plan step 2 (2026-11-23; 箭10 2026-11-24): promql had four readers in the views, topology
// and alerts two each. The engine reads each once with the viewer's token, passes the answers through unchanged and
// does the one join every view did for itself (reading → device, alert → device), keeping what matches no device.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

const TOPO = { nodes: [
  { id: 'mini-1', label: 'Mac mini 1', group: 'mac', host: '192.168.10.11', in_k3s_cluster: true },
  { id: 'win11-secondary', label: 'Win11 secondary', host: '192.168.10.36' },
  { id: 'agent-host', host: '127.0.0.1' },
] }
const POINTS: Record<string, unknown[]> = {
  nodeIp: [{ labels: { node: 'k3s-mini-1', internal_ip: '192.168.10.11' }, value: 1, timestamp: 1795480000 }],
  ready: [{ labels: { node: 'k3s-mini-1' }, value: 1, timestamp: 1795480000 }],
  up: [{ labels: { instance: '192.168.10.36:9100' }, value: 1, timestamp: 1795480000 }, { labels: { instance: '10.0.0.9:9100' }, value: 0, timestamp: 1795480000 }],
}
const ALERTS = { alerts: [
  { labels: { alertname: 'NodeDown', instance: '192.168.10.36:9100', severity: 'warning' }, state: 'firing' },
  { labels: { alertname: 'PodCrash', namespace: 'x', instance: '192.168.10.11:10250' }, state: 'firing' },
] }

type Seen = { path: string; auth?: string }
async function rig(over: { topo?: [number, unknown]; alerts?: [number, unknown] } = {}) {
  const seen: Seen[] = []
  const p = await listen(createServer((req, res) => {
    const url = new URL(req.url!, 'http://p')
    seen.push({ path: req.url!, auth: req.headers.authorization })
    const reply = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }
    if (url.pathname === '/api/v1/topology') return reply(...(over.topo ?? [200, TOPO]))
    if (url.pathname === '/api/v1/telemetry/alerts') return reply(...(over.alerts ?? [200, ALERTS]))
    if (url.pathname === '/api/v1/telemetry/promql') {
      const key = Object.keys(QUERIES).find(k => QUERIES[k] === url.searchParams.get('q'))!
      return reply(200, { points: POINTS[key] ?? [] })
    }
    reply(404, {})
  }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {} }))
  return { e, seen }
}
const get = async (e: string) => (await fetch(`${e}/engine/v1/hardware`, { headers: { authorization: 'Bearer v' } })).json() as Promise<any>

test('each upstream is read once, with the viewer token, and passed through unchanged', async () => {
  const { e, seen } = await rig()
  const b = await get(e)
  const hw = seen.filter(s => !s.path.startsWith('/api/v1/auth'))
  assert.equal(hw.length, 2 + Object.keys(QUERIES).length)
  assert.ok(hw.every(s => s.auth === 'Bearer v'))
  assert.equal(new Set(hw.map(s => s.path)).size, hw.length)
  assert.equal(b.model, 'hardware')
  assert.deepEqual(b.data.topology, TOPO.nodes)
  assert.deepEqual(b.data.prom.up, POINTS.up)
  assert.deepEqual(b.data.alerts, ALERTS.alerts)
})

test('readings and alerts join their device by node, address or host; the rest is kept unattached', async () => {
  const { e } = await rig()
  const { data } = await get(e)
  const dev = (id: string) => data.devices.find((d: any) => d.id === id)
  assert.equal(dev('mini-1').node, 'k3s-mini-1')
  assert.deepEqual(dev('mini-1').readings.map((r: any) => r.query).sort(), ['nodeIp', 'ready'])
  assert.equal(dev('win11-secondary').readings[0].source, QUERIES.up)
  assert.equal(dev('win11-secondary').alerts[0].labels.alertname, 'NodeDown')
  // A loopback host is no address; a workload alert's instance does not place it (it has no node label here).
  assert.equal(dev('agent-host').ip, null)
  assert.deepEqual(data.unattached.readings.map((r: any) => r.labels.instance), ['10.0.0.9:9100'])
  assert.deepEqual(data.unattached.alerts.map((a: any) => a.labels.alertname), ['PodCrash'])
})

test('evidence names each query, says an empty query missing, and carries evaluation and expiry times', async () => {
  const { e } = await rig()
  const { evidence } = await get(e)
  const of = (src: string) => evidence.find((x: any) => x.source === src)
  assert.equal(of(queryPath(QUERIES.up)).outcome, 'read')
  assert.equal(of(queryPath(QUERIES.up)).evaluatedAt, new Date(1795480000 * 1000).toISOString())
  assert.ok(of(queryPath(QUERIES.up)).expiresAt)
  assert.equal(of(queryPath(QUERIES.pods)).outcome, 'missing')
  assert.equal(of('/api/v1/topology?env=prod').outcome, 'read')
})

test('without the topology there are no devices to speak of: no data, the reason in evidence', async () => {
  const { e } = await rig({ topo: [500, {}] })
  const b = await get(e)
  assert.equal(b.data, null)
  assert.equal(b.evidence.find((x: any) => x.source === '/api/v1/topology?env=prod').detail, 'HTTP 500')
})

test('an alerts answer without its list is an error, not "no alerts"', async () => {
  const { e } = await rig({ alerts: [200, { status: 'ok' }] })
  const b = await get(e)
  assert.equal(b.data.alerts, null)
  assert.match(b.evidence.find((x: any) => x.source === '/api/v1/telemetry/alerts').detail, /no alerts list/)
})
