import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http'
import { envelope } from './envelope.ts'
import { readAs, type Upstream } from './upstream.ts'
import { readDomains } from './domains.ts'
import { readHardware } from './hardware.ts'
import { idOf, readDistrict, readTechTree, repoOf } from './district.ts'
import { streamTraffic } from './traffic.ts'
import { queryOf, readCommunication } from './communication.ts'
import { readReport, reportQueryOf } from './report.ts'
import { readListed, upstreamOf, type Reads } from './allowlist.ts'
import { READS as INFRA } from './infra.ts'
import { READS as DELIVERY } from './deliveryReads.ts'
import { READS as BUS } from './busReads.ts'
import { identityOf } from './identity.ts'

/**
 * The engine's backend, API v1 under /engine/v1/ (served at ops.bifrost.lan/engine/). Read only: any method but
 * GET is refused, so nothing can write through the engine (writes go to the platform's own front door).
 */
export const API_VERSION = 1
export type Config = { upstream: Upstream; version: string; commit: string; log?: (line: string) => void; busClient?: string; heartbeatMs?: number }

const urlOf = (req: IncomingMessage) => new URL(req.url ?? '/', 'http://engine')

type Handler = (req: IncomingMessage, cfg: Config) => Promise<{ status: number; body: unknown }>

const health: Handler = async (req, cfg) => {
  const [up, who] = await Promise.all([
    readAs<{ status?: string; version?: string; commit?: string }>(cfg.upstream, '/health', req.headers.authorization),
    identityOf(cfg.upstream, req.headers.authorization),
  ])
  return { status: 200, body: envelope('health', [up.evidence], { engine: { api: API_VERSION, version: cfg.version, commit: cfg.commit }, platform: up.body }, new Date(), who) }
}

/** A read whose envelope carries who asked (identity.ts), the two fetched side by side. */
const withIdentity = (read: (up: Upstream, auth: string | undefined, req: IncomingMessage) => Promise<object>): Handler => async (req, cfg) => {
  const [body, who] = await Promise.all([read(cfg.upstream, req.headers.authorization, req), identityOf(cfg.upstream, req.headers.authorization)])
  return { status: 200, body: { ...body, identity: who } }
}

/** Liveness and readiness: the process answers. Reads nothing upstream, so a platform outage never restarts the engine
 * (it keeps answering, each read saying "platform unreachable" with the reason). */
const live: Handler = async (_req, cfg) => ({ status: 200, body: { live: true, api: API_VERSION, version: cfg.version, commit: cfg.commit } })

/** A declared list of reads (allowlist.ts): the read named in `read=`, its parameters checked, or 400 with why. */
const listed = (group: string, reads: Reads): Handler => async (req, cfg) => {
  const u = upstreamOf(reads, urlOf(req))
  if ('error' in u) return { status: 400, body: { error: u.error } }
  return withIdentity((up, auth) => readListed(group, up, auth, u))(req, cfg)
}

const ROUTES: Record<string, Handler> = {
  '/engine/v1/live': live,
  '/engine/v1/health': health,
  '/engine/v1/domains': async (req, cfg) => {
    const [body, who] = await Promise.all([readDomains(cfg.upstream, req.headers.authorization), identityOf(cfg.upstream, req.headers.authorization)])
    return { status: 200, body: { ...body, identity: who } }
  },
  '/engine/v1/hardware': withIdentity(readHardware),
  '/engine/v1/techtree': async (req, cfg) => {
    const repo = repoOf(urlOf(req))
    if (!repo) return { status: 400, body: { error: 'repo must be a repository name' } }
    return withIdentity((up, auth) => readTechTree(up, auth, repo))(req, cfg)
  },
  '/engine/v1/district': async (req, cfg) => {
    const url = urlOf(req), id = idOf(url), repo = repoOf(url)
    if (!id) return { status: 400, body: { error: 'id must be a domain id (lowercase letters, digits, - or _)' } }
    if (!repo) return { status: 400, body: { error: 'repo must be a repository name' } }
    return withIdentity((up, auth) => readDistrict(up, auth, id, repo))(req, cfg)
  },
  '/engine/v1/communication': async (req, cfg) => {
    const q = queryOf(urlOf(req))
    if ('error' in q) return { status: 400, body: { error: q.error } }
    return withIdentity((up, auth) => readCommunication(up, auth, q))(req, cfg)
  },
  '/engine/v1/report': async (req, cfg) => {
    const q = reportQueryOf(urlOf(req))
    if ('error' in q) return { status: 400, body: { error: q.error } }
    return withIdentity((up, auth) => readReport(up, auth, q))(req, cfg)
  },
  '/engine/v1/infra': listed('infra', INFRA),
  '/engine/v1/delivery': listed('delivery', DELIVERY),
  '/engine/v1/bus': listed('bus', BUS),
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

export function makeServer(cfg: Config): Server {
  const log = cfg.log ?? (line => process.stdout.write(line + '\n'))
  return createServer(async (req, res) => {
    const t0 = Date.now()
    const path = new URL(req.url ?? '/', 'http://engine').pathname
    let status = 500
    try {
      if (req.method !== 'GET') { status = 405; send(res, status, { error: 'the engine only reads; write through the platform' }); return }
      // A stream answers on its own response and holds it open; the log line is written when it ends.
      if (path === '/engine/v1/traffic') { status = await streamTraffic(req, res, cfg.upstream, { client: cfg.busClient, heartbeatMs: cfg.heartbeatMs }); return }
      const h = ROUTES[path]
      if (!h) { status = 404; send(res, status, { error: `no such engine read: ${path}` }); return }
      const out = await h(req, cfg)
      status = out.status
      send(res, status, out.body)
    } catch (e) {
      send(res, status, { error: e instanceof Error ? e.message : String(e) })
    } finally {
      // Method, path (no query), status and time only: never a header, so never a token.
      log(`${req.method} ${path} ${status} ${Date.now() - t0}ms`)
    }
  })
}
