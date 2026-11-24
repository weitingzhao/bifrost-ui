import type { IncomingMessage, ServerResponse } from 'node:http'
import { envelope } from './envelope.ts'
import { identityOf } from './identity.ts'
import { readAs, type Upstream } from './upstream.ts'
import { SseParser, sseMessage } from './sse.ts'

/**
 * Step 4 (engine backend plan, 2026-11-23; 箭10 2026-11-24): the bus's deliveries as trips, one stream for the views
 * instead of each opening the bus (City's traffic, the Bus page, Agents' event layer). GET /engine/v1/traffic is a
 * Server-Sent Events stream:
 *   event: hello   the envelope: the bus contract read for this stream (topics and clients with their domains) and
 *                  its evidence, the identity epoch
 *   event: trip    one delivery: an event taken by one reader (a receipt), from the topic's domain to the reader's,
 *                  as the contract declares them (null where it declares none: the view counts those, never guesses)
 *   event: state   how the upstream stream stands: live, denied (the platform refused the token), off (no bus here),
 *                  ended (the upstream closed; reconnect, the cursor resumes it), each with its reason
 * Upstream: GET /api/v1/bus/contract once at the start, then GET /api/v1/bus/stream?client=&receipts=1 with the
 * viewer's token, resumed from the view's Last-Event-ID. The engine keeps nothing between streams. Its upstream
 * reader name defaults to the Console's own ("console"), so switching the views over replaces that reader instead of
 * adding one to the bus; its receipts (the picture reading, not the system talking) are never trips.
 */
export const CONTRACT = '/api/v1/bus/contract'
export const STREAM = '/api/v1/bus/stream'
export const OBSERVER = 'gate:stream:console'
export const HEARTBEAT_MS = 15_000
/** Event types remembered to join receipts to, newest kept. */
const KNOWN_EVENTS = 4000

export type BusContract = { topics: { type: string; domain?: string }[]; clients: { name: string; domain?: string }[] }
export type Trip = { communication: string; id: string; type: string; consumer: string; at: string; from: string | null; to: string | null }
export type TrafficOptions = { client?: string; heartbeatMs?: number }

/** A receipt joined to its event and the contract (the Console's busFacts, the same rule); null when it is no trip. */
export function tripOf(contract: BusContract | null, typeOf: (id: string) => string | undefined, r: { id: string; consumer: string; at: string }): Trip | null {
  const type = typeOf(r.id)
  if (r.consumer === OBSERVER || !type) return null
  return { communication: `${r.id}>${r.consumer}`, id: r.id, type, consumer: r.consumer, at: r.at,
    from: contract?.topics.find(t => t.type === type)?.domain ?? null, to: contract?.clients.find(c => c.name === r.consumer)?.domain ?? null }
}

export async function streamTraffic(req: IncomingMessage, res: ServerResponse, up: Upstream, opts: TrafficOptions = {}): Promise<number> {
  const authorization = req.headers.authorization
  const abort = new AbortController()
  req.on('close', () => abort.abort())
  res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' })
  const write = (s: string) => { if (!res.writableEnded) res.write(s) }
  const beat = setInterval(() => write(': heartbeat\n\n'), opts.heartbeatMs ?? HEARTBEAT_MS)
  const state = (connection: string, detail: string | null) => write(sseMessage('state', { connection, detail }))
  try {
    const [c, who] = await Promise.all([readAs<BusContract>(up, CONTRACT, authorization), identityOf(up, authorization)])
    const contract = c.evidence.outcome === 'read' && Array.isArray(c.body?.topics) && Array.isArray(c.body?.clients) ? c.body : null
    const evidence = contract || c.evidence.outcome !== 'read' ? c.evidence : { ...c.evidence, outcome: 'error' as const, detail: 'incomplete answer: no topics or clients; trips cannot be placed' }
    write(sseMessage('hello', envelope('traffic', [evidence], { contract }, new Date(), who)))

    const headers: Record<string, string> = { accept: 'text/event-stream' }
    if (authorization) headers.authorization = authorization
    const last = req.headers['last-event-id']
    if (typeof last === 'string' && last) headers['last-event-id'] = last
    let r: Response
    try {
      r = await (up.fetch ?? fetch)(new URL(`${STREAM}?client=${encodeURIComponent(opts.client ?? 'console')}&receipts=1`, up.base), { headers, signal: abort.signal })
    } catch (e) {
      if (!abort.signal.aborted) state('ended', `platform unreachable: ${e instanceof Error ? e.message : String(e)}`)
      return 200
    }
    if (r.status === 401 || r.status === 403) { state('denied', `the platform refused your token (HTTP ${r.status})`); return 200 }
    if (r.status === 404 || r.status === 502 || r.status === 503) { state('off', r.status === 404 ? 'this platform has no bus routes' : `HTTP ${r.status}`); return 200 }
    if (!r.ok || !r.body) { state('ended', `HTTP ${r.status}`); return 200 }
    state('live', null)
    const parser = new SseParser()
    const types = new Map<string, string>()
    const decoder = new TextDecoder()
    const reader = r.body.getReader()
    for (;;) {
      const { value, done } = await reader.read().catch(() => ({ value: undefined, done: true as const }))
      if (abort.signal.aborted) return 200
      if (done) break
      const batch = parser.push(decoder.decode(value, { stream: true }))
      for (const m of batch.messages) {
        let body: { id?: string; type?: string; consumer?: string; at?: string }
        try { body = JSON.parse(m.data) } catch { continue }
        if (m.event === 'rcpt') {
          const trip = body.id && body.consumer && body.at ? tripOf(contract, id => types.get(id), { id: body.id, consumer: body.consumer, at: body.at }) : null
          if (trip) write(sseMessage('trip', trip, m.id))
        } else if (body.id && body.type) {
          types.set(body.id, body.type)
          if (types.size > KNOWN_EVENTS) types.delete(types.keys().next().value!)
        }
      }
      const error = batch.comments.find(x => x.startsWith('error '))
      if (error) state('live', error.slice('error '.length))
      if (batch.comments.includes('receipts off')) state('live', 'the bus is not sending receipts: no trips can be seen')
    }
    state('ended', 'the platform closed the stream; reconnect to resume')
    return 200
  } finally {
    clearInterval(beat)
    abort.abort()
    res.end()
  }
}
