import type { CityContent } from '../city/content'
import type { Path, Place } from '../city/places'
import type { Block } from '../city/cards'

/** Additive observation contract v1. No transport, judgments or workflow actions. */
export type ReadEvidence = {
  source: string
  outcome: 'read' | 'missing' | 'error'
  receivedAt: string
  evaluatedAt?: string
  expiresAt?: string
  detail?: string
}
export type ObservationSnapshot = {
  version: 1
  id: string
  capturedAt: string
  provenance: 'live' | 'recorded' | 'fixture'
  content: CityContent
  evidence: Record<string, readonly ReadEvidence[]>
  /** Already-projected facts from other contracts, captured with this snapshot; never a second transport. */
  layerPanels?: Readonly<Record<string, ObservationPanel[]>>
}
export type ObservationContext = { selected: Path; metrics: boolean; at: string }
/** glyph (0.48.0, optional): a world glyph name (city/worldGlyphs) the content chose for this panel's subject, e.g. its domain. */
export type ObservationPanel = { id: string; label: string; blocks: Block[]; glyph?: string }
export type ObservationView = {
  id: string; label: string
  present: (snapshot: ObservationSnapshot, context: ObservationContext) => ObservationPanel[]
}
/** Layers receive the same snapshot/context as the main view. They must not fetch or mutate facts. */
export type ObservationLayer = ObservationView & { unavailable?: string }
export const pathKey = (path: readonly string[]) => path.map(encodeURIComponent).join('/')
export function objectsIn(tree: Place, path: Path = []): { place: Place; path: Path }[] {
  return [{ place: tree, path }, ...tree.children.flatMap(p => objectsIn(p, [...path, p.id]))]
}
export function readQuality(reads: readonly ReadEvidence[], at: string): string {
  if (!reads.length) return 'Unknown provenance'
  if (reads.some(r => r.outcome === 'error')) return 'Read failed'
  if (reads.some(r => r.outcome === 'missing')) return 'Missing'
  const time = Date.parse(at)
  if (!Number.isFinite(time) || reads.some(r => !r.evaluatedAt || !Number.isFinite(Date.parse(r.evaluatedAt)))) return 'Unknown measurement time'
  if (reads.some(r => Date.parse(r.evaluatedAt!) > time)) return 'Clock mismatch'
  if (reads.some(r => r.expiresAt && Date.parse(r.expiresAt) <= time)) return 'Stale'
  if (reads.some(r => !r.expiresAt || !Number.isFinite(Date.parse(r.expiresAt)))) return 'Freshness unknown'
  return 'Within refresh window'
}
