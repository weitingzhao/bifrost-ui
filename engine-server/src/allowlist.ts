import { envelope, type Envelope, type ReadEvidence } from './envelope.ts'
import type { Upstream } from './upstream.ts'

/**
 * A declared list of platform reads served as they come (steps 7e, 7a: pages whose Console readers are thin, an HTTP
 * check and the JSON, so there is no translation to move). GET /engine/v1/<group>?read=<name>&<params> reads exactly
 * that route with the viewer's token and answers the envelope with the platform's answer unchanged as data. An
 * allow-list, not a proxy: no path is passed through, every parameter is checked against its pattern, and a list
 * holds reads only (each list's test says so). A failed read is an error with its reason and no data, except where
 * the page shows the failure's own body (`keepErrorBody`): there the body comes with the error evidence.
 */
export type Param = { re: RegExp; required?: boolean }
export type Read = { path: string; params?: Record<string, Param>; keepErrorBody?: boolean }

/** Shared parameter patterns. */
export const NS = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
export const NAME = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/
export const ENV = /^(dev|stg|prod)$/
export const INT = (max: number) => new RegExp(`^(?:[1-9]\\d{0,${String(max).length - 1}})$`)

export type Reads = Record<string, Read>

/** The platform path for a request, or why there is none. Path parameters fill {…}; the rest become the query, in the declared order. */
export function upstreamOf(reads: Reads, url: URL): { name: string; path: string; keepErrorBody: boolean } | { error: string } {
  const name = url.searchParams.get('read') ?? ''
  const r = reads[name]
  if (!r) return { error: `read must be one of: ${Object.keys(reads).join(', ')}` }
  for (const k of url.searchParams.keys()) if (k !== 'read' && !(r.params && k in r.params)) return { error: `${name} takes no parameter ${k}` }
  let path = r.path
  const query = new URLSearchParams()
  for (const [k, p] of Object.entries(r.params ?? {})) {
    const v = url.searchParams.get(k)
    if (v == null || v === '') { if (p.required) return { error: `${name} needs ${k}` }; continue }
    if (!p.re.test(v)) return { error: `${k} is not a valid value for ${name}` }
    if (path.includes(`{${k}}`)) path = path.replace(`{${k}}`, encodeURIComponent(v))
    else query.set(k, v)
  }
  const qs = query.toString()
  return { name, path: qs ? `${path}?${qs}` : path, keepErrorBody: !!r.keepErrorBody }
}

export async function readListed(group: string, up: Upstream, authorization: string | undefined, u: { name: string; path: string; keepErrorBody: boolean }, now = () => new Date()): Promise<Envelope<unknown>> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (authorization) headers.authorization = authorization
  const model = `${group}:${u.name}`
  let r: Response
  try {
    r = await (up.fetch ?? fetch)(new URL(u.path, up.base), { headers, signal: AbortSignal.timeout(up.timeoutMs ?? 10_000) })
  } catch (e) {
    const why = e instanceof Error ? e.name === 'TimeoutError' ? 'timed out' : e.message : String(e)
    return envelope(model, [{ source: u.path, outcome: 'error', receivedAt: now().toISOString(), detail: `platform unreachable: ${why}` }], null)
  }
  const receivedAt = now().toISOString()
  const body: unknown = await r.json().catch(() => undefined)
  if (r.ok) {
    if (body === undefined) return envelope(model, [{ source: u.path, outcome: 'error', receivedAt, detail: 'the answer is not JSON' }], null)
    return envelope(model, [{ source: u.path, outcome: 'read', receivedAt }], body)
  }
  const ev: ReadEvidence = { source: u.path, receivedAt, outcome: r.status === 404 ? 'missing' : 'error',
    detail: r.status === 401 || r.status === 403 ? `the platform refused your token (HTTP ${r.status})` : `HTTP ${r.status}` }
  return envelope(model, [ev], u.keepErrorBody && body !== undefined ? body : null)
}
