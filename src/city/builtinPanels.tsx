import type { Panel } from './content'
import { RulersPanel } from './rulers'
import { isWired, meterText, type Place } from './places'
import { FORM_NAME, keyOf } from './library/key'
import { KeyIcon } from './library/keyIcons'
import { spriteUrl } from './sprites'

/**
 * The cards the engine draws by itself, from the places alone (moved from the platform's content,
 * 2026-11-21: they only ever read what the engine already holds): a facility's key, the rulers its
 * rooms count with, what a place holds, and the card of a picked thing. A content that speaks the
 * cards contract (CityContent.version 2) gets these without writing them, and adds only its own data.
 *
 * Nothing made up: a card shows what the place says or nothing.
 */

const KIND_WORD = { town: 'City', district: 'District', building: 'Building', room: 'Room' } as const

/** A thing's reading in words, or how it stands, or that nothing reads it yet. */
const readingOf = (c: Place) => c.meter ? meterText(c.meter) : c.state ?? (isWired(c) ? 'read inside' : 'not wired')
const toneOf = (c: Place) => c.state === 'down' ? 'g2-warn' : c.state === 'online' ? '' : 'g2-unknown'

function InsideTable({ place, open }: { place: Place; open: (child: Place) => void }) {
  return <table className="g2-table">
    <thead><tr><th>Name</th><th>Kind</th><th className="num">Size</th><th>Readings</th></tr></thead>
    <tbody>
      {place.children.map(c => (
        <tr key={c.id} className={isWired(c) ? undefined : 'g2-ghost-row'}>
          <td><button className="g2-link" onClick={() => open(c)}>{c.label}</button></td>
          <td>{KIND_WORD[c.kind]}</td>
          <td className="num">{c.shape.replace('x', '×')}</td>
          <td className={toneOf(c)}>{readingOf(c)}</td>
        </tr>
      ))}
    </tbody>
  </table>
}

/** A facility's key: each thing drawn on it, what it means, and what it shows now (library/key.ts). */
function KeyTable({ place, full }: { place: Place; full: boolean }) {
  const { rows } = keyOf(place)
  return <ul className={`g2-key${full ? ' full' : ''}`}>
    {rows.map(r => (
      <li key={r.id}>
        <KeyIcon id={r.id} />
        <div><b>{r.shows}</b><span>{r.meaning}</span></div>
        <em title={r.source ? `Read from ${r.source}` : undefined}>{r.now}</em>
      </li>
    ))}
  </ul>
}

/** `open` goes into a district or building and picks a room, as tapping its block does. */
export function builtinPanels(place: Place, open: (child: Place) => void): Panel[] {
  const key: Panel[] = place.look ? [{ id: 'key', title: `Key · ${FORM_NAME[keyOf(place).form]}`, dock: 'left', body: ({ size }) => <KeyTable place={place} full={size !== 'card'} /> }] : []
  // A computer's rooms count standard parts: how much one part stands for is adjustable here (2026-11-20).
  if (place.look) key.push({ id: 'rulers', title: 'Rulers', dock: 'left', body: <RulersPanel /> })
  return [...key, ...(place.children.length > 0 ? [{ id: 'inside', title: `Inside ${place.label}`, dock: 'right' as const, body: <InsideTable place={place} open={open} /> }] : [])]
}

/** The card of a picked thing: its question, and its reading with where it was read; a facility's carries its key. */
export function builtinPicked(item: Place): Panel {
  return {
    id: `picked-${item.id}`, title: item.label, dock: 'right',
    body: ({ size }) => <div className="g2-picked">
      <p>{item.question}</p>
      {item.picture && <img className="g2-room-picture" src={spriteUrl(item.picture.make())} alt={`${item.label} room`} style={{ width: '100%', height: 'auto', display: 'block' }} />}
      {item.look && <KeyTable place={item} full={size !== 'card'} />}
      {item.kind !== 'room' && <p className="g2-hint">Double-click, or scroll in, to go inside</p>}
      {!item.look && <dl>
        <div><dt>Readings</dt><dd className={toneOf(item)}>{readingOf(item)}</dd></div>
        {item.meter && <div><dt>Read from</dt><dd><code>{item.meter.source}</code></dd></div>}
      </dl>}
    </div>,
  }
}
