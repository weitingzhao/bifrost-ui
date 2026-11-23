import { ReplyTrail } from './ReplyTrail'
import { OfficeWorld } from './OfficeWorld'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Mail, List, LayoutGrid } from 'lucide-react'
import { evidenceThrough, projectCommunication, projectionKey, scopeFor, STAGES, STAGE_LABEL, type CommunicationProjection, type CommunicationScope, type CommunicationSnapshot, type Exchange } from './model'
import './communication.css'

export function WorkingStudio({ snapshot, stationImage, ledgerOnly = false, selectedId, onSelected, through: controlledThrough, onThrough, scope: controlledScope, onScopeChange, onProjection }: { snapshot: CommunicationSnapshot; stationImage: string; ledgerOnly?: boolean; through?: string; onThrough?: (at: string) => void; selectedId?: string; onSelected?: (id: string) => void; scope?: CommunicationScope; onScopeChange?: (scope: CommunicationScope) => void; onProjection?: (projection: CommunicationProjection) => void }) {
  const [selected, setSelected] = useState<string | null>(selectedId ?? null)
  const select = (id: string) => { setSelected(id); onSelected?.(id) }
  const [layout, setLayout] = useState<'studio' | 'ledger'>(ledgerOnly ? 'ledger' : 'studio')
  const [localScope, setLocalScope] = useState<CommunicationScope>(() => scopeFor(selectedId))
  const { channel, member } = controlledScope ?? localScope
  const changeScope = (next: CommunicationScope) => { if (controlledScope === undefined) setLocalScope(next); onScopeChange?.(next) }
  const setChannel = (c: 'message' | 'event') => changeScope({ channel: c, member: '' })
  const focus = (m: string) => changeScope({ channel, member: m })
  useEffect(() => { if (selectedId !== undefined) { setSelected(selectedId); if (controlledScope === undefined) setLocalScope(s => ({ ...s, channel: scopeFor(selectedId).channel })) } }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps
  const [localThrough, setLocalThrough] = useState('')
  const through = controlledThrough ?? localThrough
  const setThrough = (at: string) => { if (controlledThrough === undefined) setLocalThrough(at); onThrough?.(at) }
  const observed = evidenceThrough(snapshot.exchanges, through)
  const projection = projectCommunication(snapshot.exchanges, through, { channel, member }, selected)
  const exchanges = projection.exchanges
  const picked = projection.exchange
  const told = useRef('')
  useEffect(() => { if (!onProjection) return; const key = projectionKey(projection); if (key === told.current) return; told.current = key; const { exchange: _, ...out } = projection; onProjection(out) })
  const label = (id?: string) => snapshot.members.find(m => m.id === id)?.label ?? id ?? 'Unknown member'
  const exchangeButton = (x: Exchange) => <button key={x.channel + ':' + x.id} className="comm-exchange" aria-pressed={picked === x} onClick={() => select(x.channel + ':' + x.id)}>
    <Mail size={16} /><span><strong>{x.label}</strong><small>{label(x.from)} → {label(x.to)}</small></span><span>{x.channel === 'event' ? (x.stages.delivered ? 'Delivery observed' : 'Delivery not observed') : (x.stages.acknowledged ? 'ACK observed' : 'ACK not observed')}</span>
  </button>
  return <section className="comm-studio" aria-label="Agent collaboration" data-requested-exchange={selected||undefined} data-resolved-exchange={picked?picked.channel+':'+picked.id:undefined} data-selection-state={selected&&!picked?'missing':picked?'resolved':'empty'}>
    <div className="comm-verdict" role="status"><span>{snapshot.coverage.state === 'ready' ? 'Recorded exchanges' : snapshot.coverage.state === 'error' ? 'Observation unavailable' : 'Reading communication evidence…'}</span><small>{snapshot.coverage.updatedAt ? 'Last read ' + new Date(snapshot.coverage.updatedAt).toLocaleTimeString() : 'No successful read yet'}</small></div>
    <div className="comm-toolbar"><label>Channel <select aria-label="Communication channel" value={channel} onChange={e => setChannel(e.target.value as 'message' | 'event')}><option value="message">Agent messages</option><option value="event">Event deliveries</option></select></label><p>Observe members working together. Reading changes no message state.</p><div>{!ledgerOnly && <button aria-pressed={layout === 'studio'} onClick={() => setLayout('studio')}><LayoutGrid size={16} /> Studio</button>}<button aria-pressed={layout === 'ledger'} onClick={() => setLayout('ledger')}><List size={16} /> Ledger</button></div></div>
    <details className="comm-scope"><summary>Evidence scope and history</summary><form className="comm-history" onSubmit={event => { event.preventDefault(); const value=String(new FormData(event.currentTarget).get('through') ?? ''); setThrough(value?new Date(value).toISOString():'') }}><label>Evidence through <input aria-label="Evidence through" type="datetime-local" name="through" key={through} defaultValue={through && Number.isFinite(Date.parse(through)) ? new Date(Date.parse(through)-new Date(through).getTimezoneOffset()*60000).toISOString().slice(0,19) : ''} /></label><button type="submit">Apply time</button>{through && <button type="button" onClick={() => setThrough('')}>Return to latest</button>}<small>Filter retained evidence; not a replay of member presence.</small></form><p className="comm-note">{snapshot.coverage.note}{snapshot.coverage.truncated ? ' This is a bounded window, not the complete history.' : ''}</p></details>
    <div className="comm-issues">{observed.filter(x=>x.issue).map(x=><button key={x.channel+':'+x.id} onClick={()=>{setChannel(x.channel);select(x.channel+':'+x.id)}}>! {x.issue!.label} <small>{label(x.from)} → {label(x.to)}</small></button>)}</div>
    {layout === 'studio' && <OfficeWorld snapshot={{...snapshot, exchanges: observed.filter(x=>x.channel===channel)}} image={stationImage} selected={picked} onSelect={select} onMember={id=>focus(member===id?'':id)} />}
    <details className="comm-roster"><summary>Members and source evidence</summary>{snapshot.members.map(m=><p key={m.id}><strong>{m.label}</strong> · {m.memberships.map(s=>s.organization+' / '+(s.domain??'Outside domains')+' · '+s.role).join('; ')||'Unresolved membership'}<br/><small>{m.activity ? m.activity.label+' · '+m.activity.evidence.source+' · '+m.activity.evidence.at : 'Activity unknown'}</small></p>)}</details>
    <div className="comm-columns"><div>
      <section className="comm-exchanges"><div className="comm-listhead"><h3>{member ? 'Exchanges involving ' + label(member) : 'Observed exchanges'}</h3>{member && <button onClick={() => focus('')}>Clear member</button>}</div>
        {exchanges.length ? exchanges.map(exchangeButton) : <p>No exchanges observed in the loaded window. This does not establish inactivity.</p>}
      </section>
    </div><aside className="comm-inspector" aria-label="Exchange evidence">
      <h3>Exchange evidence</h3>{picked ? <><small>{picked.channel} · {picked.id}</small><h4>{picked.label}</h4>{picked.issue && <div className="comm-issue"><strong>! {picked.issue.label}</strong><small>{picked.issue.evidence.source} · {picked.issue.evidence.id}</small></div>}<p className="comm-direction">{label(picked.from)} <ArrowRight size={16} /> {label(picked.to)}</p>
      <ReplyTrail exchange={picked} exchanges={observed} asOf={through || snapshot.coverage.updatedAt} onSelect={select}/><dl>{STAGES.map(stage => <div key={stage}><dt>{STAGE_LABEL[stage]}</dt><dd>{picked.stages[stage]?.map(e => <details key={e.id}><summary>{new Date(e.at).toLocaleString()}</summary><small>{e.source}<br />{e.id}{e.actor ? ' · ' + e.actor : ''}</small></details>) ?? <span className="comm-unknown">Not observed</span>}</dd></div>)}</dl>
      <p className="comm-note">Delivery, ACK, acceptance and completion are separate facts. Missing evidence is not a rejection or failure.</p></> : <div><p role="status">{selected?`Requested communication ${selected} is not in the loaded evidence at this time.`:'Select an exchange when evidence is available.'}</p>{selected&&<button onClick={()=>select('')}>Clear unavailable selection</button>}</div>}
    </aside></div>
  </section>
}
