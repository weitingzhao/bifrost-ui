import { useEffect, useState, type ReactNode } from 'react'
import type { ControlRoomModel, SignalItem, SignalTrend } from './model'
import type { StatusWord } from '../city/world'

/**
 * 0.69.0: Signals' first screen, a control room (Owner 2026-11-24: "a power plant's big screen", not a wall of cards;
 * 箭10 approved the prototype, cockpit/ui-signals/control-room). One screen at 1280 and 390:
 * - the title counts what needs attention (fail, warn); "can't be read" (unknown) is its own line; boundary is quiet;
 * - the annunciator lists only those, worst first, each with one plain sentence; the source's words are in evidence;
 * - the flow shows the stages in order, each stage's lit lamps and how many are quiet;
 * - three trends from real history; a point not read is a gap, all unread is "unknown";
 * - every lamp opens its evidence; nothing the host read is dropped (the card wall stays behind "All signals").
 */
const RANK: Record<StatusWord, number> = { fail: 5, warn: 4, unknown: 3, pending: 1, info: 1, boundary: 0, ok: 0 }
export const needsAttention = (i: SignalItem) => i.word === 'fail' || i.word === 'warn'
export const cannotRead = (i: SignalItem) => i.word === 'unknown'
export function lampOrder(items: readonly SignalItem[]): SignalItem[] {
  return items.filter(i => needsAttention(i) || cannotRead(i)).sort((a, b) => RANK[b.word] - RANK[a.word] || a.stage.localeCompare(b.stage) || a.name.localeCompare(b.name))
}

export function ControlRoom({ model, onAll, actions }: { model: ControlRoomModel; onAll: () => void; actions?: ReactNode }) {
  const [open, setOpen] = useState<SignalItem | null>(null)
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  const lit = lampOrder(model.items)
  const attention = lit.filter(needsAttention), unread = lit.filter(cannotRead)
  const byId = new Map(model.items.map(i => [i.id, i]))
  return <section className="cr" aria-label="Control room">
    <style>{STYLE}</style>
    <header className="cr-head">
      <h2 className={attention.length ? '' : 'cr-calm'}><b>{attention.length}</b> need attention</h2>
      <p>{attention.filter(i => i.word === 'fail').length} fail · {attention.filter(i => i.word === 'warn').length} warn{unread.length ? <> · <span className="cr-unread">{unread.length} can&apos;t be read</span></> : null}</p>
      <span className="cr-actions">{actions}<button onClick={onAll}>All signals</button></span>
    </header>
    <div className="cr-main">
      <div className="cr-ann" role="list" aria-label="Not right">
        {lit.length === 0 && <p className="cr-quiet">Nothing needs attention. Every signal read reports ok or is quiet by design.</p>}
        {lit.map(i => <button role="listitem" key={i.id} className={'cr-tile cr-' + i.word} onClick={() => setOpen(i)}>
          <i>{i.word}</i><b>{i.name}<span> · {model.stages.find(s => s.id === i.stage)?.label ?? i.stage}</span></b><small>{i.plain}</small></button>)}
      </div>
      <div className="cr-flow" aria-label="Flow" style={{ ['--cr-cols' as string]: model.stages.length }}>
        {model.stages.map((s, n) => {
          const xs = model.items.filter(i => i.stage === s.id), on = lampOrder(xs)
          return <div className="cr-stage" key={s.id}>
            <h3>{n > 0 && <span aria-hidden>→ </span>}{s.label}</h3>
            <div className="cr-lamps">{xs.map(i => <button key={i.id} className={'cr-lamp cr-' + i.word + (on.includes(i) ? ' cr-on' : '')} title={`${i.name}: ${i.word}`} aria-label={`${i.name}: ${i.word}`} onClick={() => setOpen(i)}>
              <span className="cr-dot"/>{on.includes(i) && <span className="cr-name">{i.name}</span>}</button>)}</div>
            <p className="cr-count">{xs.length - on.length} of {xs.length} quiet</p>
          </div>
        })}
      </div>
    </div>
    <footer className="cr-trends">{model.trends.map(t => <Trend key={t.id} t={t}/>)}</footer>
    {model.notes?.length ? <p className="cr-notes">{model.notes.join(' · ')}</p> : null}
    {open && <aside className="rw-panel" aria-label="Signal evidence"><header><span className="rw-eyebrow">SIGNAL EVIDENCE</span><button aria-label="Close evidence" onClick={() => setOpen(null)}>×</button></header>
      <h2>{open.name}</h2><p><strong className={'cr-word cr-' + open.word}>{open.word}</strong> · {model.stages.find(s => s.id === open.stage)?.label ?? open.stage}</p>
      <p>{open.plain}</p>
      {open.source && <><p className="rw-eyebrow">SOURCE SAYS</p><p>{open.source}</p></>}
      {open.meters?.map(m => <p key={m.label}>{m.label}: {m.share == null ? 'not read' : Math.round(m.share * 100) + '%'}</p>)}
      {open.uses?.length ? <p>Uses: {open.uses.map(id => byId.get(id)?.name ?? id).join(', ')}</p> : null}
      {open.usedBy?.length ? <p>Used by: {open.usedBy.map(id => byId.get(id)?.name ?? id).join(', ')}</p> : null}
      {!open.evidence.length && <p>Source evidence not supplied. Unknown.</p>}
      {open.evidence.map((r, k) => <details open key={r.source + k}><summary>{r.outcome} · {r.detail ?? 'Source evidence'}</summary><p>{r.source}</p><dl><dt>Evaluated</dt><dd>{r.evaluatedAt ?? 'Unknown'}</dd><dt>Received</dt><dd>{r.receivedAt}</dd><dt>Refresh deadline</dt><dd>{r.expiresAt ?? 'Not supplied'}</dd></dl></details>)}
      <p className="rw-disclaimer">Read-only evidence.</p>
    </aside>}
  </section>
}

function Trend({ t }: { t: SignalTrend }) {
  const read = t.values.filter((v): v is number => v != null)
  const hours = Math.round((t.values.length - 1) * t.stepMinutes / 60)
  if (!read.length) return <div className="cr-trend" title={t.source}><span>{t.label} · {hours}h</span><b className="cr-unread">unknown</b><small>no history read</small></div>
  const lo = Math.min(...read), hi = Math.max(...read), last = t.values.at(-1)
  const y = (v: number) => 26 - (hi === lo ? 12 : ((v - lo) / (hi - lo)) * 24)
  // A gap stays a gap: each run of read points is its own line.
  const runs: string[] = []; let cur: string[] = []
  t.values.forEach((v, i) => { if (v == null) { if (cur.length) runs.push(cur.join(' ')); cur = [] } else cur.push(`${(i / (t.values.length - 1)) * 100},${y(v)}`) })
  if (cur.length) runs.push(cur.join(' '))
  const f = (v: number) => (Math.round(v * 10) / 10) + (t.unit ?? '')
  return <div className="cr-trend" title={t.source}><span>{t.label} · {hours}h</span><b>{last == null ? 'unknown' : f(last)}</b>
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden>{runs.map(r => <polyline key={r} points={r} vectorEffect="non-scaling-stroke"/>)}</svg>
    <small>range {f(lo)}–{f(hi)}</small></div>
}

const STYLE = `
.cr{display:grid;grid-template-rows:auto 1fr auto auto;gap:10px;min-height:calc(100vh - 150px)}
.cr-head{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap}
.cr-head h2{margin:0;font-size:28px;letter-spacing:-.5px}.cr-head h2 b{color:var(--w-warn-ink)}.cr-head h2.cr-calm b{color:var(--w-ok-ink)}
.cr-head p{margin:0;color:var(--muted-foreground,#9aa7b8)}.cr-actions{margin-left:auto;display:flex;gap:6px}
.cr-unread{color:var(--w-unknown-ink)}
.cr-main{display:grid;grid-template-columns:minmax(300px,38%) 1fr;gap:12px;min-height:0}
.cr-ann{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;align-content:start}
.rw-body .cr-tile{display:block;text-align:left;border:1px solid;border-radius:6px;padding:7px 9px;background:transparent}
.cr-tile i{font-style:normal;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
.cr-tile b{display:block;font-size:12px;overflow-wrap:anywhere}.cr-tile b span{font-weight:400;color:var(--muted-foreground,#9aa7b8)}
.cr-tile small{display:block;font-size:11px;opacity:.85;margin-top:2px}
.rw-body .cr-tile.cr-fail{border-color:var(--w-fail);background:color-mix(in srgb,var(--w-fail) 14%,transparent)}.cr-tile.cr-fail i{color:var(--w-fail-ink)}
.rw-body .cr-tile.cr-warn{border-color:var(--w-warn);background:color-mix(in srgb,var(--w-warn) 12%,transparent)}.cr-tile.cr-warn i{color:var(--w-warn-ink)}
.rw-body .cr-tile.cr-unknown{border-color:color-mix(in srgb,var(--w-unknown) 60%,transparent);opacity:.8}.cr-tile.cr-unknown i{color:var(--w-unknown-ink)}
.cr-flow{display:grid;grid-template-columns:repeat(var(--cr-cols,4),minmax(0,1fr));gap:10px;align-content:start;border:1px solid var(--border,#2a3646);border-radius:8px;padding:12px}
.cr-stage h3{margin:0 0 8px;font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-foreground,#9aa7b8)}
.cr-lamps{display:flex;flex-direction:column;gap:6px}
.rw-body .cr-lamp{all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;min-height:10px}
.cr-lamp:focus-visible{outline:2px solid var(--ring,#f2d27a);outline-offset:2px}
.cr-dot{width:6px;height:6px;border-radius:50%;background:color-mix(in srgb,var(--w-ok) 45%,transparent);flex:none}
.cr-lamp.cr-boundary .cr-dot{background:color-mix(in srgb,var(--w-boundary) 70%,transparent)}.cr-lamp.cr-pending .cr-dot{background:var(--w-pending-ink)}
.cr-on .cr-dot{width:14px;height:14px}.cr-on.cr-fail .cr-dot{background:var(--w-fail);box-shadow:0 0 10px var(--w-fail)}
.cr-on.cr-warn .cr-dot{background:var(--w-warn);box-shadow:0 0 10px var(--w-warn)}.cr-on.cr-unknown .cr-dot{width:11px;height:11px;background:var(--w-unknown)}
.cr-name{font-size:12px;font-weight:600;overflow-wrap:anywhere}
.cr-lamps:has(.cr-on){}.cr-stage .cr-lamps{flex-direction:row;flex-wrap:wrap}.cr-stage .cr-on{flex-basis:100%}
.cr-count{margin:8px 0 0;font-size:10px;color:var(--muted-foreground,#9aa7b8)}
.cr-trends{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cr-trend{display:grid;grid-template-columns:1fr auto;align-items:baseline;border:1px solid var(--border,#2a3646);border-radius:8px;padding:6px 10px}
.cr-trend span,.cr-trend small{font-size:10px;color:var(--muted-foreground,#9aa7b8)}.cr-trend b{font-size:14px}
.cr-trend svg{grid-column:1/-1;width:100%;height:30px}.cr-trend polyline{fill:none;stroke:var(--w-ok-ink);stroke-width:1.5}
.cr-trend small{grid-column:1/-1}
.cr-notes,.cr-quiet{margin:0;font-size:10px;color:var(--muted-foreground,#9aa7b8)}
.cr-word.cr-fail{color:var(--w-fail-ink)}.cr-word.cr-warn{color:var(--w-warn-ink)}.cr-word.cr-unknown{color:var(--w-unknown-ink)}
@media(max-width:700px){
  .cr{min-height:0;gap:8px}.cr-head h2{font-size:22px}.cr-head{gap:4px 10px}
  .cr-main{grid-template-columns:1fr}.cr-ann{grid-template-columns:1fr;gap:3px}
  /* one line per lamp on a phone: word, name, then its plain sentence; the rest is one tap away */
  .rw-body .cr-tile{padding:4px 8px;display:flex;gap:8px;align-items:baseline;white-space:nowrap;overflow:hidden}
  .cr-tile i{flex:none;min-width:52px}.cr-tile b{flex:none;font-size:11px;max-width:55%;overflow:hidden;text-overflow:ellipsis}.cr-tile b span{display:none}
  .cr-tile small{flex:1;min-width:0;font-size:10px;margin:0;overflow:hidden;text-overflow:ellipsis}
  .cr-flow{grid-template-columns:1fr;gap:6px;padding:8px}.cr-stage{display:grid;grid-template-columns:96px 1fr;align-items:center;gap:6px}
  .cr-stage h3{margin:0}.cr-count{display:none}.cr-stage .cr-on{flex-basis:auto}.cr-name{display:none}
  .cr-trends{gap:6px}.cr-trend{padding:4px 6px}.cr-trend svg{height:22px}.cr-trend b{font-size:12px}
}`
