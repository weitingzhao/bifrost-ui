import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { makeServer } from '../src/server.ts'

// Origin: engine backend plan step 6 (2026-11-23; 箭10 2026-11-24): Ledger's CI report and Signals operations read
// the delivery runs themselves. The engine reads them with the viewer's token and serves the Console's own report
// projections; a source naming another run is an error, never that run's report.

const open: Server[] = []
after(() => { for (const s of open) s.close() })
const listen = (s: Server) => new Promise<string>(ok => { open.push(s); s.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)) })

const RUNS = { cluster_id: 'prod', namespace: 'cicd', pipeline: 'bifrost-deliver-platform', reachability: 'ok', detail: 'listed', generated_at: '2026-11-24T03:00:00Z',
  runs: [{ name: 'deliver-platform-abc', namespace: 'cicd', pipeline: 'bifrost-deliver-platform', revision: 'e01bcb7', status: 'Succeeded', start_time: '2026-11-24T02:50:00Z' }] }
const TIMINGS = { as_of: '2026-11-24T03:00:00Z', runs: [{ name: 'deliver-platform-abc', pipeline: 'bifrost-deliver-platform', status: 'Succeeded', created_at: '2026-11-24T02:49:00Z',
  results: [{ name: 'commit', value: 'e01bcb7' }], skipped: [], tasks: [{ name: 'build', task: 'kaniko', status: 'Succeeded', results: [], steps: [{ name: 'build', status: 'Succeeded', exit_code: 0 }] }] }] }
const LOGS = { cluster_id: 'prod', namespace: 'cicd', run_name: 'deliver-platform-abc', logs: 'built', generated_at: '2026-11-24T03:00:00Z' }

async function rig(over: Record<string, [number, unknown]> = {}) {
  const seen: string[] = []
  const p = await listen(createServer((req, res) => {
    const url = new URL(req.url!, 'http://p')
    seen.push(req.url!)
    const reply = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }
    for (const [k, v] of Object.entries(over)) if (url.pathname.endsWith(k)) return reply(...v)
    if (url.pathname.endsWith('/runs')) return reply(200, RUNS)
    if (url.pathname.endsWith('/timings')) return reply(200, TIMINGS)
    if (url.pathname.endsWith('/logs')) return reply(200, LOGS)
    reply(404, {})
  }))
  const e = await listen(makeServer({ upstream: { base: p, timeoutMs: 2000 }, version: 't', commit: 't', log: () => {} }))
  return { e, seen }
}
const get = async (e: string, q: string) => { const r = await fetch(`${e}/engine/v1/report${q}`); return { status: r.status, b: await r.json() as any } }

test('a pipeline report lists its retained runs, each openable, with the source reachability as evidence', async () => {
  const { e, seen } = await rig()
  const { b } = await get(e, '?kind=pipeline&pipeline=bifrost-deliver-platform')
  assert.ok(seen.includes('/api/v1/delivery/pipelines/bifrost-deliver-platform/runs'))
  assert.equal(b.model, 'report')
  const table = b.data.panels[0].blocks[1]
  assert.deepEqual(table.rows[0].cells, ['deliver-platform-abc', 'cicd', 'bifrost-deliver-platform', 'e01bcb7', 'Succeeded', 'Not supplied', '2026-11-24T02:50:00Z', 'Not supplied'])
  assert.ok(b.data.objects[table.rows[0].open])
  assert.equal(b.data.evidence[0].evaluatedAt, '2026-11-24T03:00:00Z')
})

test('a run report carries its tasks and steps; logs are their own read', async () => {
  const { e, seen } = await rig()
  const run = (await get(e, '?kind=run&pipeline=bifrost-deliver-platform&run=deliver-platform-abc')).b
  assert.ok(seen.some(s => s.startsWith('/api/v1/delivery/pipelines/bifrost-deliver-platform/timings?limit=60&run=deliver-platform-abc')))
  assert.equal(Object.keys(run.data.objects).length, 1)
  const logs = (await get(e, '?kind=logs&run=deliver-platform-abc')).b
  assert.ok(seen.includes('/api/v1/delivery/runs/deliver-platform-abc/logs?ns=cicd'))
  assert.equal(logs.data.panels[0].blocks[1].text, 'built')
})

test('a source naming another run is an error, never that run’s report', async () => {
  const { e } = await rig({ '/timings': [200, { ...TIMINGS, runs: [{ ...TIMINGS.runs[0], name: 'someone-else' }] }] })
  const { b } = await get(e, '?kind=run&pipeline=bifrost-deliver-platform&run=deliver-platform-abc')
  assert.equal(b.data, null)
  assert.match(b.evidence[0].detail, /does not match the requested run/)
})

test('an answer without its runs list is an error, a failed read says its status', async () => {
  const { e } = await rig({ '/runs': [200, { pipeline: 'x' }] })
  assert.match((await get(e, '?kind=pipeline&pipeline=x')).b.evidence[0].detail, /no runs list/)
  const { e: e2 } = await rig({ '/logs': [502, {}] })
  assert.equal((await get(e2, '?kind=logs&run=r')).b.evidence[0].detail, 'HTTP 502')
})

test('a kind or name that is not one is refused before anything is read', async () => {
  const { e, seen } = await rig()
  for (const q of ['', '?kind=all', '?kind=pipeline&pipeline=../x', '?kind=run&pipeline=p', '?kind=logs&run=A%20B']) assert.equal((await get(e, q)).status, 400, q)
  assert.deepEqual(seen, [])
})
