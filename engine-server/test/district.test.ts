import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'

// Origin: engine backend plan step 3 (2026-11-23; 箭10 2026-11-24): City read catalog/domain per district and
// ci/domains for the tree itself. The engine passes both through unchanged and does City's one join (inner package
// imports → building edges); the loop and Other stay the view's drawing.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

const GRAPH = { version: 1, repo: 'bifrost-platform', commit: 'c272fe9a', measured: true, note: '', domains: [{ id: 'delivery', packages: 5 }, { id: 'foundation', packages: 9 }],
  edges: [{ from: 'delivery', to: 'foundation', imports: 4, wrong_way: false }], shared_packages: [],
  inner: [{ domain: 'delivery', imports: 5, pairs: [
    { from: 'api/internal/delivery/runs', to: 'api/internal/delivery/window' },
    { from: 'api/internal/delivery/runs', to: 'api/internal/delivery/window/store' },
    { from: 'api/internal/delivery/window', to: 'api/internal/delivery/runs' },
    { from: 'api/internal/delivery/runs', to: 'api/internal/delivery/runs/util' },
    { from: 'api/internal/delivery/runs', to: 'api/internal/elsewhere' },
  ] }] }
const HOLD = { id: 'delivery', packages: [{ path: 'api/internal/delivery/runs' }], groups: [], paths: [], workloads: [], buildings: [
  { id: 'runs', packages: ['api/internal/delivery/runs', 'api/internal/delivery/runs/util'] },
  { id: 'window', packages: ['api/internal/delivery/window', 'api/internal/delivery/window/store'] },
] }

async function rig(over: { graph?: [number, unknown]; hold?: [number, unknown] } = {}) {
  const seen: string[] = []
  const p = await listen(createServer((req, res) => {
    const url = new URL(req.url!, 'http://p')
    seen.push(req.url!)
    const reply = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }
    if (url.pathname === '/api/v1/ci/domains') return reply(...(over.graph ?? [200, GRAPH]))
    if (url.pathname === '/api/v1/catalog/domain') return reply(...(over.hold ?? [200, HOLD]))
    reply(404, {})
  }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {} }))
  return { e, seen }
}
const get = async (e: string, path: string) => { const r = await fetch(`${e}${path}`); return { status: r.status, b: await r.json() as any } }

test('the tech tree passes ci/domains through unchanged, for the repository asked', async () => {
  const { e, seen } = await rig()
  const { b } = await get(e, '/engine/v1/techtree')
  assert.ok(seen.includes('/api/v1/ci/domains?repo=bifrost-platform'))
  assert.deepEqual(b.data, GRAPH)
  assert.equal(b.evidence[0].source, '/api/v1/ci/domains?repo=bifrost-platform')
})

test('a graph of another version, or without its lists, is an error, never an empty tree', async () => {
  const { e } = await rig({ graph: [200, { version: 2, domains: [] }] })
  const { b } = await get(e, '/engine/v1/techtree')
  assert.equal(b.data, null)
  assert.match(b.evidence[0].detail, /who depends on whom is not known/)
})

test('a district passes its holdings through and rolls inner imports up to building edges', async () => {
  const { e, seen } = await rig()
  const { b } = await get(e, '/engine/v1/district?id=delivery')
  assert.ok(seen.includes('/api/v1/catalog/domain?id=delivery'))
  assert.deepEqual(b.data.holdings, HOLD)
  // runs→window twice (window and window/store), window→runs once; runs→runs/util stays inside; elsewhere is outside.
  assert.deepEqual(b.data.imports, { read: true, commit: 'c272fe9a', edges: [{ from: 'runs', to: 'window', imports: 2 }, { from: 'window', to: 'runs', imports: 1 }], outside: 1 })
})

test('no tree read: the holdings still come, the edges say why they are not known', async () => {
  const { e } = await rig({ graph: [500, {}] })
  const { b } = await get(e, '/engine/v1/district?id=delivery')
  assert.deepEqual(b.data.holdings, HOLD)
  assert.deepEqual(b.data.imports, { read: false, why: 'HTTP 500' })
})

test('holdings for another domain, or without their lists, are an error', async () => {
  const { e } = await rig({ hold: [200, { id: 'payload', packages: [] }] })
  const { b } = await get(e, '/engine/v1/district?id=delivery')
  assert.equal(b.data, null)
  assert.match(b.evidence[0].detail, /not delivery's holdings/)
})

test('an id or repo that is not a name is refused before anything is read', async () => {
  const { e, seen } = await rig()
  assert.equal((await get(e, '/engine/v1/district')).status, 400)
  assert.equal((await get(e, '/engine/v1/district?id=../x')).status, 400)
  assert.equal((await get(e, '/engine/v1/techtree?repo=a%2Fb')).status, 400)
  assert.deepEqual(seen, [])
})
