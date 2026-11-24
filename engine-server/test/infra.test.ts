import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'
import { READS } from '../src/infra.ts'

// Origin: engine backend plan step 7e (箭10 2026-11-24: the Console's biggest group first): the infrastructure pages
// read ~30 platform routes through thin readers. The engine serves exactly those, as an allow-list with checked
// parameters, never a path proxy; writes stay on the platform.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

async function rig(reply: (path: string) => [number, unknown] = () => [200, { ok: true }]) {
  const seen: { path: string; auth?: string }[] = []
  const p = await listen(createServer((req, res) => {
    seen.push({ path: req.url!, auth: req.headers.authorization })
    if (req.url!.startsWith('/api/v1/auth/')) { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{}'); return }
    const [status, body] = reply(req.url!)
    res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body))
  }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {} }))
  return { e, seen: () => seen.filter(s => !s.path.startsWith('/api/v1/auth/')) }
}
const get = async (e: string, q: string) => { const r = await fetch(`${e}/engine/v1/infra${q}`, { headers: { authorization: 'Bearer v' } }); return { status: r.status, b: await r.json() as any } }

test('a declared read passes the platform answer through unchanged, with the viewer token', async () => {
  const body = { nodes: [{ name: 'ubt-k3s-06', ready: true }] }
  const { e, seen } = await rig(() => [200, body])
  const { b } = await get(e, '?read=cluster.nodes')
  assert.deepEqual(seen(), [{ path: '/api/v1/cluster/nodes', auth: 'Bearer v' }])
  assert.equal(b.model, 'infra:cluster.nodes')
  assert.deepEqual(b.data, body)
  assert.equal(b.evidence[0].outcome, 'read')
})

test('path parameters fill the route, the rest become the query in the declared order', async () => {
  const { e, seen } = await rig()
  await get(e, '?read=cluster.pod-logs&tailLines=50&pod=engine-7d9f.x&ns=bifrost-platform-stg')
  await get(e, '?read=cluster.events&limit=20&ns=cicd')
  assert.deepEqual(seen().map(s => s.path), ['/api/v1/cluster/workloads/pods/bifrost-platform-stg/engine-7d9f.x/logs?tailLines=50', '/api/v1/cluster/events?ns=cicd&limit=20'])
})

test('not a proxy: unknown reads, unknown or bad parameters and missing required ones are refused before any read', async () => {
  const { e, seen } = await rig()
  for (const q of ['', '?read=cluster/../auth', '?read=cluster.workloads', '?read=cluster.workloads&ns=Bad_NS', '?read=cluster&path=/api/v1/audit', '?read=cluster.metrics&limit=0', '?read=telemetry.targets&state=all', '?read=matrix&env=qa'])
    assert.equal((await get(e, q)).status, 400, q)
  assert.deepEqual(seen(), [])
})

test('a failed read has no data, except where the page shows the failure body (network, gateway)', async () => {
  const { e } = await rig(p => p.startsWith('/api/v1/network') ? [503, { error: 'controller offline', devices: [] }] : [502, { error: 'bad gateway' }])
  const cluster = (await get(e, '?read=cluster')).b
  assert.equal(cluster.data, null)
  assert.equal(cluster.evidence[0].detail, 'HTTP 502')
  const net = (await get(e, '?read=network.devices')).b
  assert.deepEqual(net.data, { error: 'controller offline', devices: [] })
  assert.equal(net.evidence[0].outcome, 'error')
})

test('a refused token is said as refused', async () => {
  const { e } = await rig(() => [401, { error: 'viewer token required' }])
  assert.match((await get(e, '?read=cluster.pod-logs&ns=a&pod=b')).b.evidence[0].detail, /refused your token \(HTTP 401\)/)
})

test('the list holds reads only: no route of a write on these pages is declared', () => {
  const writes = /ensure|scale|rollout-restart|sync-kubeconfig|firewall|\/control\/|\/self-heal$|data-clone$/
  assert.deepEqual(Object.values(READS).map(r => r.path).filter(p => writes.test(p)), [])
})
