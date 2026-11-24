import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'
import { READS } from '../src/deliveryReads.ts'

// Origin: engine backend plan step 7a (箭10 2026-11-24, next group after 7e): the release and delivery pages read a
// dozen platform routes through thin readers. The engine serves exactly those as a declared list; starting runs,
// holding the window, rolling back and approving stay on the platform.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

async function rig(reply: (path: string) => [number, unknown] = () => [200, { ok: true }]) {
  const seen: string[] = []
  const p = await listen(createServer((req, res) => {
    if (!req.url!.startsWith('/api/v1/auth/')) seen.push(req.url!)
    const [status, body] = req.url!.startsWith('/api/v1/auth/') ? [200, {}] : reply(req.url!)
    res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body))
  }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {} }))
  return { e, seen }
}
const get = async (e: string, q: string) => { const r = await fetch(`${e}/engine/v1/delivery${q}`); return { status: r.status, b: await r.json() as any } }

test('a delivery read passes the platform answer through under its own model name', async () => {
  const body = { open: true, window: { who: 'seat:ui-engine', what: 'bifrost-ui' } }
  const { e, seen } = await rig(() => [200, body])
  const { b } = await get(e, '?read=release-window')
  assert.deepEqual(seen, ['/api/v1/delivery/release-window'])
  assert.equal(b.model, 'delivery:release-window')
  assert.deepEqual(b.data, body)
})

test('parameters are checked and passed in the declared order', async () => {
  const { e, seen } = await rig()
  await get(e, '?read=compare&to=main&from=v0.62.0&repo=bifrost-ui')
  await get(e, '?read=stages&commit=e01bcb7')
  assert.deepEqual(seen, ['/api/v1/delivery/compare?repo=bifrost-ui&from=v0.62.0&to=main', '/api/v1/agentrt/delivery?commit=e01bcb7'])
  for (const q of ['?read=compare&repo=bifrost-ui', '?read=stages&commit=XYZ', '?read=releases&limit=0', '?read=gitops-apps&name=x', '?read=rollback'])
    assert.equal((await get(e, q)).status, 400, q)
})

test('a commit no delivery names is missing, not an error, and has no data', async () => {
  const { e } = await rig(() => [404, { error: 'no external work names this commit' }])
  const { b } = await get(e, '?read=stages&commit=e01bcb7')
  assert.equal(b.data, null)
  assert.equal(b.evidence[0].outcome, 'missing')
})

test('the list holds reads only: no run start, window hold or clear, rollback or approval', () => {
  assert.deepEqual(Object.values(READS).map(r => r.path).filter(p => /rollback|hold|clear|start|approve|runs$/.test(p)), [])
})
