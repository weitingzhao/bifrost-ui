import { createHmac, randomBytes } from 'node:crypto'
import { readAs, type Upstream } from './upstream.ts'

/**
 * Who is looking, without keeping who they are (箭10 2026-11-23: the host identity epoch/ready lands in the engine
 * backend's session; the token is never a key). `epoch` is an HMAC of the caller's Authorization header under a key
 * drawn when the process starts: the same token gives the same epoch, another token another one, and the epoch says
 * nothing about the token. A restart draws a new key, so every epoch changes; a view treats that as a change of
 * identity and reads again. No token: "anonymous".
 *
 * The rule for a view (engine-backend.md §4): when an answer's epoch differs from the one it holds, drop everything
 * of the old one (data, selection, pins) before showing the new; until the first answer, say the identity is not ready.
 */
const KEY = randomBytes(32)
export const epochOf = (authorization: string | undefined): string =>
  authorization ? createHmac('sha256', KEY).update(authorization).digest('hex').slice(0, 16) : 'anonymous'

export type Identity = { epoch: string; role: string }

/** The caller's role, as the platform's capabilities say it for this token, kept a minute by epoch (never by token). */
const roles = new Map<string, { role: string; until: number }>()
export const ROLE_TTL_MS = 60_000

export async function identityOf(up: Upstream, authorization: string | undefined, now = () => Date.now()): Promise<Identity> {
  const epoch = epochOf(authorization)
  if (!authorization) return { epoch, role: 'anonymous' }
  const hit = roles.get(epoch)
  if (hit && hit.until > now()) return { epoch, role: hit.role }
  const r = await readAs<{ authenticated?: boolean; role?: string }>(up, '/api/v1/auth/capabilities', authorization)
  const role = r.evidence.outcome === 'read' && r.body?.authenticated && r.body.role ? r.body.role : 'unknown'
  // Only a role that was read is kept; a failed read is asked again next time.
  if (role !== 'unknown') roles.set(epoch, { role, until: now() + ROLE_TTL_MS })
  return { epoch, role }
}
