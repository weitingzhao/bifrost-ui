import { envelope, type Envelope } from './envelope.ts'
import { readAs, type Upstream } from './upstream.ts'

/**
 * Step 1 (Owner 2026-11-23): the domains' four lights, read once here instead of by four readers in the views
 * (City, observation-access, Signals operations, Console catalog). Upstream GET /api/v1/catalog/status: what the
 * platform's workers kept after their last scan round. The engine judges nothing: the lights, their reasons and
 * the map's inventory pass through as the platform said them; `evaluatedAt` is the scan's own time.
 */
export type Light = { value: string; why: string }
export type DomainRow = { id: string; name?: string; tier?: number; overall: string; alive: Light; interfaces: Light; boundary: Light; fresh: Light }
export type Domains = { version: number; at?: string; commit?: string; domains: DomainRow[]; note?: string; [more: string]: unknown }

export const UPSTREAM = '/api/v1/catalog/status'

export async function readDomains(up: Upstream, authorization: string | undefined): Promise<Envelope<Domains>> {
  const r = await readAs<Domains>(up, UPSTREAM, authorization)
  if (r.evidence.outcome !== 'read') return envelope<Domains>('domains', [r.evidence], null)
  const b = r.body
  // An answer without its list of domains says nothing about them: not "no domains".
  if (b == null || !Array.isArray(b.domains)) return envelope<Domains>('domains', [{ ...r.evidence, outcome: 'error', detail: 'incomplete answer: no domains list; the lights are not known' }], null)
  return envelope('domains', [{ ...r.evidence, ...(b.at ? { evaluatedAt: b.at } : {}) }], b)
}
