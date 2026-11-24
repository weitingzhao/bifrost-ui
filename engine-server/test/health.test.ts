import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'

// Origin of these cases: the engine backend plan, step 0 (2026-11-23, Owner "as recommended"): the engine holds no
// credential, forwards the viewer's token unchanged, never logs it, reads only, and says a failed read as failed.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

/** A stand-in platform: answers /health with `status`, and remembers the Authorization it was given. */
async function platform(status = 200) {
  const seen: (string | undefined)[] = []
  const url = await listen(createServer((req, res) => {
    seen.push(req.headers.authorization)
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(status === 200 ? { status: 'ok', version: '9.9.9' } : { error: 'no' }))
  }))
  return { url, seen }
}

async function engine(base: string) {
  const lines: string[] = []
  const url = await listen(makeServer({ upstream: { base, timeoutMs: 2000 }, version: '0.1.0', commit: 'abc123', log: l => lines.push(l) }))
  return { url, lines }
}

test('health answers in the v1 envelope with the engine and the platform it read', async () => {
  const p = await platform(), e = await engine(p.url)
  const r = await fetch(`${e.url}/engine/v1/health`)
  assert.equal(r.status, 200)
  const b: any = await r.json()
  assert.equal(b.version, 1)
  assert.equal(b.model, 'health')
  assert.equal(b.provenance, 'live')
  assert.deepEqual(b.data.engine, { api: 1, version: '0.1.0', commit: 'abc123' })
  assert.equal(b.data.platform.version, '9.9.9')
  assert.equal(b.evidence[0].source, '/health')
  assert.equal(b.evidence[0].outcome, 'read')
})

test('the viewer\'s token goes upstream unchanged and is never written to the log', async () => {
  const p = await platform(), e = await engine(p.url)
  const token = 'Bearer viewer-secret-token-123'
  await fetch(`${e.url}/engine/v1/health?x=1`, { headers: { authorization: token } })
  assert.equal(p.seen.at(-1), token)
  assert.ok(e.lines.length > 0)
  for (const l of e.lines) assert.ok(!l.includes('viewer-secret-token-123') && !l.includes('x=1'), l)
})

test('no token from the viewer, no token upstream: the engine has none of its own', async () => {
  const p = await platform(), e = await engine(p.url)
  await fetch(`${e.url}/engine/v1/health`)
  assert.equal(p.seen.at(-1), undefined)
})

test('a token the platform refuses is an error read, not empty data', async () => {
  const p = await platform(401), e = await engine(p.url)
  const b: any = await (await fetch(`${e.url}/engine/v1/health`)).json()
  assert.equal(b.evidence[0].outcome, 'error')
  assert.match(b.evidence[0].detail, /refused your token \(HTTP 401\)/)
  assert.equal(b.data.platform, null)
})

test('an unreachable platform is said as unreachable', async () => {
  const e = await engine('http://127.0.0.1:9')
  const b: any = await (await fetch(`${e.url}/engine/v1/health`)).json()
  assert.equal(b.evidence[0].outcome, 'error')
  assert.match(b.evidence[0].detail, /platform unreachable/)
})

test('the engine only reads: other methods are refused, unknown reads are 404', async () => {
  const p = await platform(), e = await engine(p.url)
  assert.equal((await fetch(`${e.url}/engine/v1/health`, { method: 'POST' })).status, 405)
  assert.equal((await fetch(`${e.url}/engine/v1/nothing`)).status, 404)
  assert.equal(p.seen.length, 0)
})

// Origin: deploy-day runbook (2026-11-24): the draft's probes hit /engine/v1/health, which reads the platform, so a
// platform blip would restart every engine pod. /engine/v1/live answers without any upstream read.
test('live answers without reading the platform', async () => {
  let asked = 0
  const up = createServer((_q, r) => { asked++; r.writeHead(500); r.end() })
  await new Promise<void>(ok => up.listen(0, '127.0.0.1', ok))
  const e = makeServer({ upstream: { base: `http://127.0.0.1:${(up.address() as AddressInfo).port}` }, version: 'v', commit: 'c', log: () => {} })
  await new Promise<void>(ok => e.listen(0, '127.0.0.1', ok))
  const r = await fetch(`http://127.0.0.1:${(e.address() as AddressInfo).port}/engine/v1/live`)
  assert.equal(r.status, 200)
  assert.deepEqual(await r.json(), { live: true, api: 1, version: 'v', commit: 'c' })
  assert.equal(asked, 0)
  e.close(); up.close()
})
