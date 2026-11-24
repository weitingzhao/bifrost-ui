import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'
import { SseParser } from '../src/sse.ts'

// Origin: engine backend plan step 4 (2026-11-23; 箭10 2026-11-24): the bus stream had three openers in the views
// (City's traffic, the Bus page, the live refresh). The engine opens it once per viewer, with the viewer's token, and
// turns receipts into trips by the Console's busFacts rule; the picture's own reader is never a trip.

const open: Server[] = []
after(() => { for (const s of open) { s.closeAllConnections?.(); s.close() } })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

const CONTRACT = { topics: [{ type: 'delivery.run.finished', domain: 'delivery' }, { type: 'loose.topic' }], clients: [{ name: 'gate:stream:ledger', domain: 'audit' }, { name: 'gate:stream:x' }] }
const BUS = [
  'id: 1\ndata: {"id":"e1","type":"delivery.run.finished"}\n\n',
  'id: 2\nevent: rcpt\ndata: {"id":"e1","consumer":"gate:stream:ledger","at":"2026-11-24T03:00:00Z"}\n\n',
  'id: 3\nevent: rcpt\ndata: {"id":"e1","consumer":"gate:stream:console","at":"2026-11-24T03:00:01Z"}\n\n',
  'id: 4\ndata: {"id":"e2","type":"loose.topic"}\n\nid: 5\nevent: rcpt\ndata: {"id":"e2","consumer":"gate:stream:x","at":"2026-11-24T03:00:02Z"}\n\n',
  'id: 6\nevent: rcpt\ndata: {"id":"unseen","consumer":"gate:stream:ledger","at":"2026-11-24T03:00:03Z"}\n\n',
]

async function rig(stream: { status?: number; chunks?: string[] } = {}) {
  const seen: { path: string; auth?: string; last?: string }[] = []
  const p = await listen(createServer((req, res) => {
    const url = new URL(req.url!, 'http://p')
    seen.push({ path: req.url!, auth: req.headers.authorization, last: req.headers['last-event-id'] as string | undefined })
    if (url.pathname === '/api/v1/bus/contract') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(CONTRACT)); return }
    if (url.pathname === '/api/v1/bus/stream') {
      if (stream.status && stream.status !== 200) { res.writeHead(stream.status); res.end('no'); return }
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      for (const c of stream.chunks ?? BUS) res.write(c)
      res.end()
      return
    }
    res.writeHead(404); res.end()
  }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {}, heartbeatMs: 50 }))
  return { e, seen }
}
async function collect(e: string, headers: Record<string, string> = {}) {
  const r = await fetch(`${e}/engine/v1/traffic`, { headers: { authorization: 'Bearer v', ...headers } })
  const p = new SseParser()
  const text = await r.text()
  return { type: r.headers.get('content-type'), ...p.push(text) }
}

test('receipts become trips from the topic’s domain to the reader’s; the picture’s reader and unseen events are not trips', async () => {
  const { e, seen } = await rig()
  const { type, messages } = await collect(e)
  assert.match(type!, /text\/event-stream/)
  const hello = JSON.parse(messages.find(m => m.event === 'hello')!.data)
  assert.deepEqual(hello.data.contract, CONTRACT)
  const trips = messages.filter(m => m.event === 'trip').map(m => ({ cursor: m.id, ...JSON.parse(m.data) }))
  assert.deepEqual(trips, [
    { cursor: '2', id: 'e1', communication: 'e1>gate:stream:ledger', type: 'delivery.run.finished', consumer: 'gate:stream:ledger', at: '2026-11-24T03:00:00Z', from: 'delivery', to: 'audit' },
    { cursor: '5', id: 'e2', communication: 'e2>gate:stream:x', type: 'loose.topic', consumer: 'gate:stream:x', at: '2026-11-24T03:00:02Z', from: null, to: null },
  ])
  assert.deepEqual(messages.filter(m => m.event === 'state').map(m => JSON.parse(m.data).connection), ['live', 'ended'])
  const s = seen.find(x => x.path.startsWith('/api/v1/bus/stream'))!
  assert.equal(s.path, '/api/v1/bus/stream?client=console&receipts=1')
  assert.equal(s.auth, 'Bearer v')
})

test('the view’s cursor resumes the upstream stream', async () => {
  const { e, seen } = await rig()
  await collect(e, { 'last-event-id': '42' })
  assert.equal(seen.find(x => x.path.startsWith('/api/v1/bus/stream'))!.last, '42')
})

test('a refused token is said as denied, no bus as off', async () => {
  const denied = await collect((await rig({ status: 403 })).e)
  assert.deepEqual(JSON.parse(denied.messages.find(m => m.event === 'state')!.data), { connection: 'denied', detail: 'the platform refused your token (HTTP 403)' })
  const off = await collect((await rig({ status: 404 })).e)
  assert.deepEqual(JSON.parse(off.messages.find(m => m.event === 'state')!.data), { connection: 'off', detail: 'this platform has no bus routes' })
})

test('a message split across chunks still parses; the bus saying receipts are off is passed on', async () => {
  const { e } = await rig({ chunks: ['id: 1\ndata: {"id":"e1","type":"deliv', 'ery.run.finished"}\n\n: receipts off\n\nid: 2\nevent: rcpt\ndata: {"id":"e1","consumer":"gate:stream:ledger","at":"t"}\n\n'] })
  const { messages } = await collect(e)
  assert.equal(messages.filter(m => m.event === 'trip').length, 1)
  assert.ok(messages.some(m => m.event === 'state' && /not sending receipts/.test(JSON.parse(m.data).detail ?? '')))
})
