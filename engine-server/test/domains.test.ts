import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'

// Origin: engine backend plan step 1 (2026-11-23): catalog/status had four readers in the views; the engine reads it
// once with the viewer's token and passes the lights through unjudged, so a switched view shows exactly what it
// showed before (the switch is checked by comparing both, field by field).

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

const STATUS = { version: 1, at: '2026-11-23T16:00:00Z', commit: 'd364567d', domains: [
  { id: 'delivery', name: 'Delivery', tier: 2, overall: 'good', alive: { value: 'good', why: '16 of 16 ready' }, interfaces: { value: 'good', why: '0 5xx' }, boundary: { value: 'good', why: 'none' }, fresh: { value: 'good', why: '0 min' } },
], references: [{ from: 'a', to: 'b', imports: 1 }] }

async function rig(status: number, body: unknown) {
  const seen: { path?: string; auth?: string }[] = []
  const p = await listen(createServer((req, res) => { seen.push({ path: req.url, auth: req.headers.authorization }); res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {} }))
  return { e, seen }
}

test('domains pass through unchanged, with the scan time as the evaluation time', async () => {
  const { e, seen } = await rig(200, STATUS)
  const b: any = await (await fetch(`${e}/engine/v1/domains`, { headers: { authorization: 'Bearer v' } })).json()
  assert.equal(seen[0].path, '/api/v1/catalog/status')
  assert.equal(seen[0].auth, 'Bearer v')
  assert.equal(b.model, 'domains')
  assert.deepEqual(b.data, STATUS)
  assert.equal(b.evidence[0].outcome, 'read')
  assert.equal(b.evidence[0].evaluatedAt, '2026-11-23T16:00:00Z')
})

test('an answer without the domains list is an error, never an empty list', async () => {
  const { e } = await rig(200, { version: 1 })
  const b: any = await (await fetch(`${e}/engine/v1/domains`)).json()
  assert.equal(b.data, null)
  assert.equal(b.evidence[0].outcome, 'error')
  assert.match(b.evidence[0].detail, /lights are not known/)
})

test('a refused token is said as refused', async () => {
  const { e } = await rig(403, { error: 'forbidden' })
  const b: any = await (await fetch(`${e}/engine/v1/domains`)).json()
  assert.equal(b.data, null)
  assert.match(b.evidence[0].detail, /refused your token \(HTTP 403\)/)
})
