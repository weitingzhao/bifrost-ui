import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'

// Origin: engine backend plan step 5 and Agents' scope vocabulary (2026-11-23; 箭10 2026-11-24): the Agents view read
// the ledger, threads, work reports and lineage itself and filtered in the browser. The engine reads them with the
// viewer's token and evaluates time → channel → member → request with the views' own projectCommunication.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

const ev = (id: number, type: string, actor: string, stream: string, body: Record<string, unknown>, at: string) =>
  ({ event_id: id, event_stream_id: stream, seq: id, event_type: type, actor_id: actor, body_json: body, at })
const EVENTS = { next: '9.9', events: [
  ev(3, 'message_acked', 'thread:b', 'mbox:thread:b', { message_id: 'm1' }, '2026-11-24T01:02:00Z'),
  ev(2, 'seat.mail.arrived', 'gate', 'mbox:thread:b', { message_id: 'm1' }, '2026-11-24T01:01:00Z'),
  ev(1, 'message_posted', 'thread:a', 'mbox:thread:b', { message_id: 'm1', to: 'thread:b', kind: 'ask' }, '2026-11-24T01:00:00Z'),
  ev(4, 'message_posted', 'thread:c', 'mbox:owner', { message_id: 'm2', to: 'owner', kind: 'note' }, '2026-11-24T02:00:00Z'),
] }
const THREADS = { threads: [{ thread: 'a', vendor: 'claude', title: 'UI / Engine', status: 'in_turn', at: '2026-11-24T01:00:00Z' }] }
const SEATS = [{ seat: 'thread:a', message_id: 's1', at: '2026-11-24T01:30:00Z', goal: 'engine step 5', percent: 40 }]

async function rig(over: { events?: [number, unknown] } = {}) {
  const seen: string[] = []
  const p = await listen(createServer((req, res) => {
    const url = new URL(req.url!, 'http://p')
    seen.push(req.url!)
    const reply = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }
    if (url.pathname === '/api/v1/agentrt/events') return reply(...(over.events ?? [200, EVENTS]))
    if (url.pathname === '/api/v1/agent/threads') return reply(200, THREADS)
    if (url.pathname === '/api/v1/agentrt/seats') return reply(200, SEATS)
    if (url.pathname === '/api/v1/lineage') return reply(200, { threads: [] })
    reply(404, {})
  }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {} }))
  return { e, seen }
}
const get = async (e: string, q = '') => { const r = await fetch(`${e}/engine/v1/communication${q}`); return { status: r.status, b: await r.json() as any } }

test('letters become exchanges with their stages; members come from roster, threads and work reports', async () => {
  const { e, seen } = await rig()
  const { b } = await get(e, '?through=2026-11-24T03:00:00Z')
  assert.ok(seen.some(s => s.startsWith('/api/v1/agentrt/events?limit=500&types=message_posted%2Cseat.mail.arrived%2Cmessage_acked')))
  assert.deepEqual(b.data.scope, { channel: 'message', member: '' })
  const m1 = b.data.exchanges.find((x: any) => x.id === 'm1')
  assert.equal(m1.from, 'thread:a'); assert.equal(m1.to, 'thread:b')
  assert.deepEqual(Object.keys(m1.stages).sort(), ['acknowledged', 'delivered', 'sent'])
  const a = b.data.members.find((m: any) => m.id === 'thread:a')
  assert.equal(a.label, 'UI / Engine'); assert.equal(a.work.goal, 'engine step 5'); assert.equal(a.work.progress, 40)
  assert.equal(b.data.coverage.state, 'ready')
  assert.equal(b.data.coverage.scoped, false)
})

test('time, then member, then the request: the window is cut, members are not, a request outside is missing', async () => {
  const { e } = await rig()
  const early = (await get(e, '?through=2026-11-24T01:30:00Z')).b.data
  assert.deepEqual(early.exchanges.map((x: any) => x.id), ['m1'])
  const mine = (await get(e, '?through=2026-11-24T03:00:00Z&member=owner&requested=message:m1')).b.data
  assert.deepEqual(mine.exchanges.map((x: any) => x.id), ['m2'])
  assert.equal(mine.state, 'missing')
  assert.equal(mine.coverage.scoped, true)
  assert.ok(mine.members.some((m: any) => m.id === 'thread:a'))
})

test('an event request opens the event channel, and the coverage says event deliveries are on the traffic stream', async () => {
  const { e } = await rig()
  const { b } = await get(e, '?requested=event:x')
  assert.equal(b.data.scope.channel, 'event')
  assert.deepEqual(b.data.exchanges, [])
  assert.match(b.data.coverage.note, /arrive on \/engine\/v1\/traffic/)
})

test('a page with a hole is refused whole: no letters rather than letters with gaps, said as an error', async () => {
  const { e } = await rig({ events: [200, { next: '1.1', events: [{ event_id: 'x' }] }] })
  const { b } = await get(e)
  assert.equal(b.data.coverage.state, 'error')
  assert.deepEqual(b.data.exchanges, [])
  assert.match(b.evidence.find((x: any) => x.source === '/api/v1/agentrt/events').detail, /invalid page/)
})

test('history: before reads back from an event id; a full page says there is more', async () => {
  const many = { next: '1.1', events: Array.from({ length: 500 }, (_, i) => ev(1000 - i, 'message_posted', 'thread:a', 'mbox:owner', { message_id: 'm' + i, to: 'owner' }, '2026-11-24T01:00:00Z')) }
  const { e, seen } = await rig({ events: [200, many] })
  const { b } = await get(e, '?before=1200')
  assert.ok(seen.some(s => s.includes('before_event_id=1200')))
  assert.equal(b.data.coverage.history.hasOlder, true)
  assert.match(b.data.coverage.history.note, /before=501/)
})

test('a channel, member, time or cursor that is not one is refused before anything is read', async () => {
  const { e, seen } = await rig()
  for (const q of ['?channel=sms', '?member=a%20b', '?through=yesterday', '?before=-1']) assert.equal((await get(e, q)).status, 400, q)
  assert.deepEqual(seen, [])
})
