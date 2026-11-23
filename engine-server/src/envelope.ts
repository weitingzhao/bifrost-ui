/**
 * The one shape every engine read answers with (engine API v1). `evidence` says, read by read, which platform route
 * was asked, how it went and when: the same ReadEvidence the views already show (bifrost-ui observation/model.ts).
 * Nothing is judged here; a failed read is said as failed, never as empty.
 */
// The engine's contract type, not a copy (the views already read it): a type-only import, erased at run time.
import type { ReadEvidence } from '../../src/observation/model.ts'
export type { ReadEvidence }

/** Who asked (identity.ts): the epoch changes when the token does; the role is what the platform said it may do. */
export type EnvelopeIdentity = { epoch: string; role: string }

export type Envelope<T> = {
  version: 1
  model: string
  capturedAt: string
  provenance: 'live'
  identity?: EnvelopeIdentity
  evidence: ReadEvidence[]
  data: T | null
}

export const envelope = <T>(model: string, evidence: ReadEvidence[], data: T | null, now = new Date(), identity?: EnvelopeIdentity): Envelope<T> =>
  ({ version: 1, model, capturedAt: now.toISOString(), provenance: 'live', ...(identity ? { identity } : {}), evidence, data })
