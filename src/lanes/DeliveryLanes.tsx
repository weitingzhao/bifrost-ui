import './lanes.css'
import { CardView } from '../city/CardView'
import type { Block } from '../city/cards'
import { STATUS, STATUS_WORDS } from '../city/world'
import { STAGE_LABEL, type DeliveryLane, type LaneSource, type LaneStage } from './model'

export type DeliveryLanesProps = {
  lanes: DeliveryLane[]
  /** The opened lane (its id), kept by the host. */
  selected: string
  onSelect: (id: string) => void
  /** What the list is: which source, which window. */
  scope: string
  /** The engine's upstream reads; any not reached is said above the list (its cells are unknown). */
  sources?: LaneSource[]
  /** The oldest run the cluster still keeps; checks older than it are unknown ("runs cleaned"). */
  oldestRun?: string | null
  /** The read has not answered yet: says "Reading…" instead of an empty list. */
  reading?: boolean
  /** The clock short times are counted from (the host's; tests pass one). */
  now?: number
}

const fullTime = (at?: string | null) => (at ? at.replace('T', ' ').slice(0, 16) + 'Z' : '')
/** Short times (World D4): <1h, 3h, 2d; the full time goes in the title. */
export function shortAgo(at: string | null | undefined, now: number): string {
  const t = at ? Date.parse(at) : NaN
  if (!Number.isFinite(t)) return ''
  const hours = (now - t) / 3_600_000
  return hours < 1 ? '<1h' : hours < 48 ? `${Math.floor(hours)}h` : `${Math.floor(hours / 24)}d`
}
/** The colours come from the engine's STATUS table (World A3): lamp = fill, word = ink (dark) or paper (light). */
const statusVars = Object.fromEntries(STATUS_WORDS.flatMap(w => [[`--lane-${w}`, STATUS[w].fill], [`--lane-ink-${w}`, STATUS[w].ink], [`--lane-paper-${w}`, STATUS[w].paper]]))

function Node({ stage, now }: { stage: LaneStage; now: number }) {
  const label = STAGE_LABEL[stage.key]
  const body = <>
    <span className={`lane-mark lane-${stage.kind} lane-w-${stage.status}`} aria-hidden="true" />
    <span className="lane-node-text">
      <span className="lane-node-label">{label}</span>
      <span className={`lane-node-word lane-ink-${stage.status}`}>{stage.status}{stage.attempts > 1 ? ` ×${stage.attempts}` : ''}</span>
      {stage.at && <span className="lane-node-at" title={fullTime(stage.at)}>{shortAgo(stage.at, now)}</span>}
      {stage.reason && <span className="lane-node-reason">{stage.reason}</span>}
    </span>
  </>
  return <li className={`lane-node lane-node-${stage.kind}`} title={`${label}: ${stage.status}${stage.reason ? ` — ${stage.reason}` : ''}`}>
    {stage.link?.startsWith('#') ? <a href={stage.link}>{body}</a> : body}
  </li>
}

/**
 * One lane's track: the eleven cells on one grid row; a cell that ran more than once says ×n. Under the row, a cell that
 * ran more than once and says why (the refusal, the failed task) is a red dashed edge back to "Pushed ready/" with
 * that reason; the cells that only re-ran because the change was pushed again draw no edge of their own.
 */
function Track({ lane, now }: { lane: DeliveryLane; now: number }) {
  const ready = lane.stages.findIndex(s => s.key === 'ready')
  const returns = lane.stages.map((s, i) => ({ s, i })).filter(({ s, i }) => s.attempts > 1 && !!s.reason && ready >= 0 && i > ready)
  return <div className="lane-track" style={{ ['--lane-steps' as string]: lane.stages.length }}>
    <ol className="lane-steps" aria-label={`Way of ${lane.id}`}>
      {lane.stages.map(stage => <Node key={stage.key} stage={stage} now={now} />)}
    </ol>
    {returns.length > 0 && <ul className="lane-returns" aria-label={`Sent back: ${returns.length}`}>
      {returns.map(({ s, i }) => <li key={s.key} className="lane-return" style={{ gridColumn: `${ready + 1} / ${i + 2}` }}>
        <span className="lane-return-edge" aria-hidden="true" />
        <span className="lane-return-text">{`↩ ${STAGE_LABEL[s.key]} sent it back ${s.attempts - 1}× — ${s.reason}`}</span>
      </li>)}
    </ul>}
  </div>
}

/** The opened lane: every cell with its run, attempts and time; the reason is the row's hover. */
function details(lane: DeliveryLane, now: number): Block[] {
  return [
    { kind: 'facts', rows: [
      { label: 'Change-Id', value: lane.changeId ?? `none (${lane.id})` }, { label: 'Repository', value: lane.repo },
      { label: 'Thread', value: lane.title ?? lane.session ?? 'Not recorded' },
    ] },
    // Three columns (World D3, 390): the cell with its run under it, the word, the short time; the reason is the hover.
    { kind: 'table', head: [{ label: 'Cell · run' }, { label: 'Status' }, { label: 'At' }],
      rows: lane.stages.map(s => ({ key: s.key, href: s.link ?? undefined, title: s.reason ?? undefined,
        cells: [{ lines: [STAGE_LABEL[s.key], ...(s.run ? [{ text: `${s.run}${s.attempts > 1 ? ` ×${s.attempts}` : ''}`, tone: 'pending' as const }] : [])] },
          { text: `${s.status}${s.attempts > 1 ? ` ×${s.attempts}` : ''}`, tone: s.status }, { text: shortAgo(s.at, now) || '—', title: fullTime(s.at) }] })) },
  ]
}

/**
 * The delivery lanes: one row per change (Change-Id), its eleven cells from a branch to PROD with the gates on them, as
 * the engine judged them; open a lane to see each cell's run. On a phone (≤ 600 px) the track turns vertical.
 */
export function DeliveryLanes({ lanes, selected, onSelect, scope, sources = [], oldestRun = null, reading = false, now = Date.now() }: DeliveryLanesProps) {
  const missing = sources.filter(s => !s.reached)
  return <section className="delivery-lanes" aria-label="Delivery lanes" style={statusVars}>
    <p className="lanes-scope">{`Scope: ${scope}. Lanes supplied: ${reading ? '?' : lanes.length}.${oldestRun ? ` Runs kept since ${fullTime(oldestRun)}; older checks are unknown.` : ''}`}</p>
    {missing.length > 0 && <p className="lanes-missing" role="note">{`Not read: ${missing.map(s => `${s.name}${s.reason ? ` (${s.reason})` : ''}`).join('; ')}. The cells that depend on them are unknown.`}</p>}
    {reading && <p className="lanes-empty" role="status">Reading…</p>}
    {!reading && lanes.length === 0 && <p className="lanes-empty">No lanes supplied; this is not "nothing is moving".</p>}
    <ul className="lanes-list">
      {lanes.map(lane => {
        const open = lane.id === selected
        return <li key={lane.id} className={`lane${open ? ' lane-open' : ''}`}>
          <button type="button" className="lane-head" aria-expanded={open} onClick={() => onSelect(open ? '' : lane.id)}>
            <span className={`lane-mark lane-step lane-w-${lane.status}`} aria-hidden="true" />
            <span className="lane-title">{lane.subject ?? lane.id}</span>
            <span className="lane-meta">{lane.repo} · {(lane.changeId ?? lane.id).slice(0, 9)} · <span title={fullTime(lane.updatedAt)}>{shortAgo(lane.updatedAt, now)}</span></span>
            {lane.stuck && <span className="lane-stuck">stuck</span>}
            <span className={`lane-word lane-ink-${lane.status}`}>{lane.status}</span>
          </button>
          <Track lane={lane} now={now} />
          {open && <div className="lane-details" aria-label={`Cells of ${lane.id}`}><CardView body={details(lane, now)} /></div>}
        </li>
      })}
    </ul>
  </section>
}
