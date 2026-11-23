import type { ReactNode } from 'react'
import { STATUS, worldVars, type StatusWord } from './world'
import './worldFrame.css'

/**
 * The one frame every view wears (箭10 2026-11-23; the World line's proposal, cockpit/ui-world/frame): the same bar
 * on City, Signals, Agents and Console, so going from one to another is moving inside one world, not to another
 * website. Pure display: it reads no route and fetches nothing; the host says where it is and passes links and
 * callbacks. The four places stand in one fixed order the engine sets; the host gives only their addresses.
 *
 *   row 1   brand · where you are (crumbs, the last one the thing you are on) · the four places · environment ·
 *           time (live or pinned, and when) · alerts (how many, the worst) · identity (ready or switching)
 *   row 2   only when there is something to say: the Page / Table looks of this place, one line of context
 *
 * Nothing made up: an alert count not read is "not read", never 0; time with no reading says "time unknown".
 */
export const WORLD_PLACES = ['city', 'signals', 'agents', 'console'] as const
export type WorldPlace = (typeof WORLD_PLACES)[number]
const PLACE_LABEL: Record<WorldPlace, string> = { city: 'City', signals: 'Signals', agents: 'Agents', console: 'Console' }

export type WorldFrameProps = {
  here: WorldPlace
  /** Where you are inside it, outermost first; the last is the thing you are on. */
  crumbs: { label: string; href?: string }[]
  /** Each place's address (keep the selection in it when you can); a place without one is shown, not linked. */
  hrefs: Partial<Record<WorldPlace, string>>
  env?: string
  /** Live: the newest reading's time; pinned: the time the view was fixed at. No `at`: not known. */
  time?: { mode: 'live' | 'pinned'; at?: string }
  /** The monitoring's firing alerts: `count` null means not read (say `why`). */
  alerts?: { count: number | null; worst?: StatusWord; why?: string; onOpen?: () => void }
  /** The viewer's identity (engine envelope identity.epoch): until ready, the frame says it is switching. */
  identity?: { ready: boolean; label?: string }
  /** Row 2: the looks of this place and one line of context; absent, row 2 takes no room. */
  looks?: { id: string; label: string; href: string; on: boolean }[]
  context?: ReactNode
}

const hhmm = (iso?: string) => {
  const t = iso ? new Date(iso) : null
  return t && Number.isFinite(t.getTime()) ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : null
}

/** A lamp in the vocabulary's colour: unknown is a dashed ring, pending an empty ring (never a finding). */
function Dot({ s }: { s: StatusWord }) {
  return <i className={`wf-dot wf-${s}`} style={s === 'unknown' || s === 'pending' ? undefined : { background: STATUS[s].fill }} aria-hidden />
}

export function WorldFrame(p: WorldFrameProps) {
  const at = hhmm(p.time?.at)
  const a = p.alerts
  const alertWord: StatusWord = a ? (a.count == null ? 'unknown' : a.count === 0 ? 'ok' : a.worst ?? 'warn') : 'unknown'
  const alertText = a ? (a.count == null ? <>Alerts<span className="wf-long">&nbsp;not read</span><span className="wf-short">&nbsp;?</span></> : <>Alerts {a.count}<span className="wf-long">&nbsp;firing</span></>) : null
  const row2 = (p.looks && p.looks.length > 0) || p.context
  return <header className="wf" style={worldVars()} aria-label="Where you are">
    <div className="wf-row">
      <span className="wf-brand"><i aria-hidden /><span className="wf-long">BIFROST</span></span>
      <nav className="wf-crumbs" aria-label="Breadcrumb">
        {p.crumbs.map((c, i) => <span key={i} className={i === p.crumbs.length - 1 ? 'wf-here' : undefined}>
          {i > 0 && <span className="wf-sep" aria-hidden>›</span>}
          {c.href && i < p.crumbs.length - 1 ? <a href={c.href}>{c.label}</a> : c.label}
        </span>)}
      </nav>
      <nav className="wf-places" aria-label="Places">
        {WORLD_PLACES.map(id => id === p.here
          ? <span key={id} className="wf-on" aria-current="page">{PLACE_LABEL[id]}</span>
          : p.hrefs[id] ? <a key={id} href={p.hrefs[id]}>{PLACE_LABEL[id]}</a>
          : <span key={id} className="wf-off" title="No address from this view">{PLACE_LABEL[id]}</span>)}
      </nav>
      <span className="wf-chips">
        {p.env && <span className="wf-chip wf-env">{p.env}</span>}
        {p.time && <span className="wf-chip" title={p.time.at ?? 'time not known'}>
          {/* Live or pinned is a mode, not a judgement: pinned is information, a time not known cannot be judged. */}
          {(p.time.mode === 'pinned' || !at) && <Dot s={at ? 'info' : 'unknown'} />}{p.time.mode === 'pinned' ? 'Pinned' : 'Live'}<span className="wf-long">&nbsp;·</span>&nbsp;{at ?? 'time unknown'}
        </span>}
        {alertText && (a?.onOpen
          ? <button className="wf-chip" onClick={a.onOpen} title={a.why}><Dot s={alertWord} />{alertText}</button>
          : <span className="wf-chip" title={a?.why}><Dot s={alertWord} />{alertText}</span>)}
        {p.identity && !p.identity.ready && <span className="wf-chip" role="status" title="Identity switching"><Dot s="pending" />Identity<span className="wf-long">&nbsp;switching</span><span className="wf-short">&nbsp;…</span></span>}
        {p.identity?.ready && p.identity.label && <span className="wf-chip">{p.identity.label}</span>}
      </span>
    </div>
    {row2 && <div className="wf-row2">
      {p.looks && p.looks.length > 0 && <nav className="wf-looks" aria-label="Looks">
        {p.looks.map(l => l.on ? <span key={l.id} className="wf-on" aria-current="true">{l.label}</span> : <a key={l.id} href={l.href}>{l.label}</a>)}
      </nav>}
      {p.context && <span className="wf-context">{p.context}</span>}
    </div>}
  </header>
}
