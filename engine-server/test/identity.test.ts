import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'
import { epochOf } from '../src/identity.ts'

// Origin: 箭10 2026-11-23 settled the host identity epoch/ready: it lives in the engine backend's session, the epoch
// changes when the token does, and the token is never a key or written anywhere. These cases hold that.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

test('the same token keeps its epoch, another token gets another, none is anonymous', () => {
  assert.equal(epochOf('Bearer a'), epochOf('Bearer a'))
  assert.notEqual(epochOf('Bearer a'), epochOf('Bearer b'))
  assert.equal(epochOf(undefined), 'anonymous')
  assert.match(epochOf('Bearer a'), /^[0-9a-f]{16}$/)
})

test('the epoch says nothing of the token', () => {
  const t = 'Bearer viewer-secret-token-123'
  assert.ok(!epochOf(t).includes('viewer') && !epochOf(t).includes('123'))
})

test('every answer carries the identity: epoch and the role the platform gives the token', async () => {
  let caps = 0
  const p = await listen(createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    if (req.url === '/api/v1/auth/capabilities') { caps++; res.end(JSON.stringify({ authenticated: req.headers.authorization === 'Bearer v', role: 'viewer' })); return }
    res.end(JSON.stringify({ version: 1, domains: [] }))
  }))
  const e = await listen(makeServer({ upstream: { base: p }, version: 't', commit: 't', log: () => {} }))
  const a: any = await (await fetch(`${e}/engine/v1/domains`, { headers: { authorization: 'Bearer v' } })).json()
  assert.equal(a.identity.epoch, epochOf('Bearer v'))
  assert.equal(a.identity.role, 'viewer')
  // Kept a minute by epoch: a second read does not ask the platform again.
  await fetch(`${e}/engine/v1/domains`, { headers: { authorization: 'Bearer v' } })
  assert.equal(caps, 1)
  const b: any = await (await fetch(`${e}/engine/v1/health`, { headers: { authorization: 'Bearer w' } })).json()
  assert.notEqual(b.identity.epoch, a.identity.epoch)
  assert.equal(b.identity.role, 'unknown')
  const c: any = await (await fetch(`${e}/engine/v1/health`)).json()
  assert.deepEqual(c.identity, { epoch: 'anonymous', role: 'anonymous' })
})
