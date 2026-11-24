import type { Block, Tone } from './cards'
import { isWired, meterText, type Place } from './places'
import { statusOfState } from './world'

/**
 * What a place holds, as a table the engine's CardView draws (Ledger line and Engine, 2026-11-23, D9: the "Inside"
 * card was hand-drawn markup and the platform's City ledger drew the same table again with its own component; now
 * there is one table, as data, and both draw it). A row goes into the child (`open` is its id); a child nothing
 * reads is a ghost row, as it is a ghost on the map. Pure: hosts call it for their own carrier (LedgerGrid).
 */
const KIND_WORD = { town: 'City', district: 'District', building: 'Building', room: 'Room' } as const

/** A thing's reading in words, or how it stands, or that nothing reads it yet. */
export const readingOf = (c: Place): string => (c.meter ? meterText(c.meter) : null) ?? c.state ?? (c.inside === 'reading' ? 'reading…' : c.inside ? 'not read' : isWired(c) ? 'read inside' : 'not wired')
/** A child's reading tone: its state through the one mapping (world.ts statusOfState); fine says nothing. */
const toneOf = (c: Place): Tone | undefined => { const w = statusOfState(c.state); return w === 'ok' ? undefined : w === 'pending' ? 'unknown' : w }

export function insideBlock(place: Place): Block {
  return {
    kind: 'table',
    head: [{ label: 'Name' }, { label: 'Kind' }, { label: 'Size', num: true }, { label: 'Readings' }],
    rows: place.children.map(c => ({
      key: c.id,
      open: c.id,
      ghost: !isWired(c),
      cells: [c.label, KIND_WORD[c.kind], c.shape.replace('x', '×'), { text: readingOf(c), ...(toneOf(c) ? { tone: toneOf(c) } : {}) }],
    })),
    empty: place.inside === 'reading' ? `Reading what ${place.label} holds…` : place.inside ? `Not read: ${place.inside.why}` : `${place.label} holds nothing yet`,
  }
}
