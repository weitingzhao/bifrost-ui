import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http'
import { envelope } from './envelope.ts'
import { readAs, type Upstream } from './upstream.ts'
import { readDomains } from './domains.ts'
import { readHardware } from './hardware.ts'
import { identityOf } from './identity.ts'

/**
 * The engine's backend, API v1 under /engine/v1/ (served at ops.bifrost.lan/engine/). Read only: any method but
 * GET is refused, so nothing can write through the engine (writes go to the platform's own front door).
 */
export const API_VERSION = 1
export type Config = { upstream: Upstream; version: string; commit: string; log?: (line: string) => void }

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

const ROUTES: Record<string, Handler> = {
  '/engine/v1/health': health,
  '/engine/v1/domains': async (req, cfg) => {
    const [body, who] = await Promise.all([readDomains(cfg.upstream, req.headers.authorization), identityOf(cfg.upstream, req.headers.authorization)])
    return { status: 200, body: { ...body, identity: who } }
  },
  '/engine/v1/hardware': withIdentity(readHardware),
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
