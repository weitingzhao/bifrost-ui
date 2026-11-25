import type { StatusWord } from '../city/world'
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
  /** 0.69.0: the control room (Signals' first screen): what is not right, one screen. Projected by the host from the same reads. */
  controlRoom?: ControlRoomModel
}
/**
 * 0.69.0 control room (ISSUE-9: like a power plant's big screen, not a wall of cards). The host projects every
 * signal it has to one item with the source's word as one of the seven; the engine only orders, counts and draws.
 * fail and warn need attention; unknown is "can't be read"; boundary is "not read by design" and stays quiet.
 */
export type SignalItem = {
  id: string
  /** The stage (column) it belongs to: one of ControlRoomModel.stages' ids. */
  stage: string
  name: string
  word: StatusWord
  /** One plain sentence for the lamp's second line; the source's own text goes in `source`. */
  plain: string
  /** The source's own words, verbatim (shown in the evidence drawer). */
  source?: string
  /** Related items' ids the host can name (e.g. a domain's imports), shown only when this item is opened. */
  uses?: string[]
  usedBy?: string[]
  /**
   * 0.70.0: the item's lamp group (ISSUE-9: one group per module, one lamp per state it has, red/yellow/green
   * so the red one is seen at once). Each lamp is one of the module's own states, worded by the host; the item's
   * `word` is still the worst of them.
   */
  lamps?: { label: string; word: StatusWord; detail?: string }[]
  /** Small meters the host read (e.g. CPU, memory as a 0–1 share), null when not read. */
  meters?: { label: string; share: number | null }[]
  evidence: readonly ReadEvidence[]
}
/** A trend: real history only. A null point is not read (never interpolated); all null draws no line. */
export type SignalTrend = { id: string; label: string; unit?: string; values: (number | null)[]; stepMinutes: number; source: string }
export type ControlRoomModel = {
  stages: { id: string; label: string }[]
  items: SignalItem[]
  trends: SignalTrend[]
  /** Quiet facts worth one line (e.g. "88 workloads ready"). */
  notes?: string[]
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
