import type { ReadEvidence } from './envelope.ts'

/**
 * Reading the platform as the viewer (Owner 2026-11-23, "as recommended"): the engine holds no credential of its
 * own. Every upstream read carries the caller's own Authorization header, unchanged, so the engine can never see
 * more than the person looking. A token the platform refuses comes back as an error read naming the status, not
 * as empty data. The header is used for the one request and kept nowhere: not logged, not in a cache key, not in
 * a URL.
 */
export type Upstream = { base: string; fetch?: typeof fetch; timeoutMs?: number }

export type Read<T> = { evidence: ReadEvidence; body: T | null }

export async function readAs<T>(up: Upstream, path: string, authorization: string | undefined, now = () => new Date()): Promise<Read<T>> {
  const source = path.split('?')[0]
  const headers: Record<string, string> = { accept: 'application/json' }
  if (authorization) headers.authorization = authorization
  const f = up.fetch ?? fetch
  try {
    const r = await f(new URL(path, up.base), { headers, signal: AbortSignal.timeout(up.timeoutMs ?? 10_000) })
    const receivedAt = now().toISOString()
    if (r.status === 401 || r.status === 403) return { evidence: { source, outcome: 'error', receivedAt, detail: `the platform refused your token (HTTP ${r.status})` }, body: null }
    if (r.status === 404) return { evidence: { source, outcome: 'missing', receivedAt, detail: 'HTTP 404' }, body: null }
    if (!r.ok) return { evidence: { source, outcome: 'error', receivedAt, detail: `HTTP ${r.status}` }, body: null }
    return { evidence: { source, outcome: 'read', receivedAt }, body: (await r.json()) as T }
  } catch (e) {
    const why = e instanceof Error ? e.name === 'TimeoutError' ? 'timed out' : e.message : String(e)
    return { evidence: { source, outcome: 'error', receivedAt: now().toISOString(), detail: `platform unreachable: ${why}` }, body: null }
  }
}
