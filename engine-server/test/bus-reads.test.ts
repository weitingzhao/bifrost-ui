import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'
import { READS } from '../src/busReads.ts'

// Origin: engine backend plan step 7b (箭10 2026-11-24): the bus page reads a dozen platform routes through thin
// readers. The engine serves exactly those as a declared list; the event replay is a page of the past only (wait=0),
// so no long poll is held open through the engine; publishing and recording regressions stay on the platform.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

async function rig() {
  const seen: string[] = []
  const p = await listen(createServer((req, res) => {
    if (!req.url!.startsWith('/api/v1/auth/')) seen.push(req.url!)
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true }))
  }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {} }))
  return { e, seen }
}
const get = async (e: string, q: string) => (await fetch(`${e}/engine/v1/bus${q}`)).status

test('bus reads go to their routes with their parameters, in the declared order', async () => {
  const { e, seen } = await rig()
  await get(e, '?read=observe&hours=24')
  await get(e, '?read=events&client=console&wait=0&since=2026-11-24T03:00:00Z&limit=100&receipts=1')
  await get(e, '?read=states&type=cluster.workload.changed')
  await get(e, '?read=evaluation&name=bus_events&days=7')
  assert.deepEqual(seen, ['/api/v1/bus/observe?hours=24', '/api/v1/bus/events?since=2026-11-24T03%3A00%3A00Z&limit=100&wait=0&receipts=1&client=console', '/api/v1/bus/states?type=cluster.workload.changed', '/api/v1/readings/evaluation?days=7&name=bus_events'])
})

test('the replay is a page of the past only, under the Console’s reader: a long poll or another reader is refused', async () => {
  const { e, seen } = await rig()
  for (const q of ['?read=events&since=2026-11-24T03:00:00Z&wait=30&client=console', '?read=events&since=2026-11-24T03:00:00Z&wait=0&client=engine', '?read=events&since=yesterday&wait=0&client=console', '?read=trace', '?read=stream'])
    assert.equal(await get(e, q), 400, q)
  assert.deepEqual(seen, [])
})

test('the list holds reads only: no publish, no regression recorded or fixed', () => {
  assert.deepEqual(Object.values(READS).map(r => r.path).filter(p => /publish|report|fixed|mark|stream/.test(p)), [])
})
