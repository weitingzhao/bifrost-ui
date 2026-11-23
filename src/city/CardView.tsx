import { useEffect, useRef, useState } from 'react'
import { isRead, type Block, type CardBody, type Cell, type Tone, type Word } from './cards'

/** The engine draws a card from its data (cards.ts); the content never writes the markup. */

const TONE: Record<Tone, string> = { good: '', warn: 'g2-warn', unknown: 'g2-unknown' }
const toneClass = (t?: Tone) => (t ? TONE[t] : '')

function WordView({ w }: { w: Word }) {
  if (typeof w !== 'object') return <>{w}</>
  return <span className={toneClass(w.tone)} title={w.title}>
    {w.text}{w.mark && <span className={toneClass(w.mark.tone ?? 'warn')}> · {w.mark.text}</span>}
  </span>
}

const isLines = (c: Cell): c is { lines: Word[]; more?: number; empty?: string } => typeof c === 'object' && 'lines' in c
const cellTone = (c: Cell) => (typeof c === 'object' && !isLines(c) ? c.tone : undefined)

function CellView({ c }: { c: Cell }) {
  if (!isLines(c)) return <WordView w={c} />
  if (c.lines.length === 0) return <span className="g2-unknown">{c.empty ?? 'none'}</span>
  return <>
    {c.lines.map((w, i) => <div key={i}><WordView w={w} /></div>)}
    {c.more ? <div className="g2-unknown">+{c.more} more</div> : null}
  </>
}

/** An address inside this app (a hash route): the only kind a card row may link to. */
const isInApp = (href: string) => href.startsWith('#') && !/^#\s*$/.test(href)

function BlockView({ b, open }: { b: Block; open?: (id: string) => void }) {
  if (b.kind === 'note') return <p className={`g2-card-note ${toneClass(b.tone ?? 'unknown')}`} title={b.title}>{b.text}</p>
  if (b.kind === 'facts') return <table className="g2-table">
    <tbody>{b.rows.map(r => <tr key={r.label}>
      <th>{r.label}</th>
      <td className={toneClass(r.tone ?? cellTone(r.value))}><CellView c={r.value} /></td>
      {r.note !== undefined && <td className="g2-unknown"><CellView c={r.note} /></td>}
    </tr>)}</tbody>
  </table>
  const nums = (b.head ?? []).map(h => !!h.num)
  return <table className="g2-table">
    {b.head && <thead><tr>{b.head.map(h => <th key={h.label} className={h.num ? 'num' : undefined}>{h.label}</th>)}</tr></thead>}
    <tbody>
      {b.rows.length === 0 && <tr><td className="g2-unknown" colSpan={Math.max(1, b.head?.length ?? 1)}>{b.empty ?? 'Nothing'}</td></tr>}
      {b.rows.map(r => <tr key={r.key} className={r.ghost ? 'g2-ghost-row' : undefined} title={r.title}>
        {r.cells.map((c, i) => {
          const cls = [nums[i] ? 'num' : '', toneClass(cellTone(c) ?? (i === 0 ? r.tone : undefined))].filter(Boolean).join(' ') || undefined
          return <td key={i} className={cls}>
            {i === 0 && r.open && open ? <button className="g2-link" onClick={() => open(r.open!)}><CellView c={c} /></button>
              : i === 0 && !r.open && r.href && isInApp(r.href) ? <a className="g2-link" href={r.href}><CellView c={c} /></a>
              : <CellView c={c} />}
          </td>
        })}
      </tr>)}
    </tbody>
  </table>
}

/** A read card: reading, then its blocks, or "not known" with why (never an empty card as if all were well). */
function ReadCard({ read, readKey, open }: { read: () => Promise<Block[]>; readKey: string; open?: (id: string) => void }) {
  const [got, setGot] = useState<{ blocks?: Block[]; error?: string } | null>(null)
  // Read once per key (the content builds a new function every render; the key says when it is a new read).
  const readRef = useRef(read)
  readRef.current = read
  useEffect(() => {
    let on = true
    setGot(null)
    readRef.current().then(blocks => { if (on) setGot({ blocks }) }, e => { if (on) setGot({ error: e instanceof Error ? e.message : String(e) }) })
    return () => { on = false }
  }, [readKey])
  if (!got) return <p className="g2-card-note g2-unknown">Reading…</p>
  if (!got.blocks) return <p className="g2-card-note g2-unknown">Not known: {got.error || 'no answer'}</p>
  return <>{got.blocks.map((b, i) => <BlockView key={i} b={b} open={open} />)}</>
}

export function CardView({ body, open }: { body: CardBody; open?: (id: string) => void }) {
  if (isRead(body)) return <ReadCard key={body.key} readKey={body.key} read={body.read} open={open} />
  return <>{body.map((b, i) => <BlockView key={i} b={b} open={open} />)}</>
}
