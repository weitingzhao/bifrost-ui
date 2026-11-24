import { ReplyTrail } from './ReplyTrail'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CollaborationScene } from './CollaborationScene'
import { memberPortrait } from './cityArt'
import { MemberDossier } from './MemberDossier'
import { worldVars } from '../city/world'
import { Glyph } from '../city/worldGlyphs'
import { STAGES, STAGE_LABEL, evidenceThrough, projectCommunication, projectionKey, scopeFor, type CommunicationProjection, type CommunicationScope, type CommunicationSnapshot, type Exchange } from './model'
import { CommunicationTimeline, type HistoryControl } from './CommunicationTimeline'
import './communication.css'

type Props = {
  snapshot: CommunicationSnapshot; stationImage: string;
  cityHref: string; consoleHref: string; selectedId?: string;
  through?: string; onThrough?: (at: string) => void;
  /** Controlled scope (vocabulary in model.ts). Omit to keep the renderer's own channel/member filters. */
  scope?: CommunicationScope; onScopeChange?: (scope: CommunicationScope) => void;
  /** Read-only notice of the window this renderer evaluated; never a write, ACK or fetch. */
  onProjection?: (projection: CommunicationProjection) => void;
  /** Worn inside the world frame (WorldFrame): the host's frame holds the places and where you are, so the renderer fills its container and drops its own switches. */
  framed?: boolean;
  /** Which world glyph stands for a domain (the host's one table, e.g. DOMAIN_GLYPH); a department with no domain or no glyph is marked unknown. */
  glyphOf?: (domain: string) => string | undefined;
  onSelected?: (id: string) => void; controls?: ReactNode; notice?: string; history?: HistoryControl;
}
/** The earliest recorded time of an exchange: when it first shows up on the clock. */
const firstAt=(x:Exchange)=>Object.values(x.stages).flat().map(e=>e.at).filter(at=>Number.isFinite(Date.parse(at))).sort((a,b)=>Date.parse(a)-Date.parse(b))[0]??''
const clock=(at:string)=>{const t=new Date(at);return Number.isFinite(t.getTime())?t.toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}):at}
/** Peer observation mode: the world is the screen; records are opened on demand. */
export function AgentWorld({snapshot, cityHref, consoleHref, selectedId, onSelected, controls, notice, history, through: controlledThrough, onThrough, scope: controlledScope, onScopeChange, onProjection, framed, glyphOf}: Props) {
  const [selected,setSelected]=useState(selectedId ?? '')
  const [panel,setPanel]=useState<'member'|'exchange'|'list'|'coverage'|null>(null)
  const [localScope,setLocalScope]=useState<CommunicationScope>(()=>scopeFor(selectedId))
  const {channel,member}=controlledScope??localScope
  const changeScope=(next:CommunicationScope)=>{if(controlledScope===undefined)setLocalScope(next);onScopeChange?.(next)}
  const setChannel=(c:'message'|'event')=>changeScope({channel:c,member:''})
  const setMember=(m:string)=>changeScope({channel,member:m})
  useEffect(()=>{if(selectedId!==undefined){setSelected(selectedId);if(controlledScope===undefined)setLocalScope(s=>({...s,channel:scopeFor(selectedId).channel}))}},[selectedId]) // eslint-disable-line react-hooks/exhaustive-deps
  const [localThrough,setLocalThrough]=useState('')
  const through=controlledThrough??localThrough
  const setThrough=(at:string)=>{if(controlledThrough===undefined)setLocalThrough(at);onThrough?.(at)}
  const [search,setSearch]=useState('')
  const visible=evidenceThrough(snapshot.exchanges,through)
  const exchanges=visible.filter(x=>x.channel===channel)
  const projection=projectCommunication(snapshot.exchanges,through,{channel,member},selected)
  const picked=projection.exchange
  // A requested letter not in the window: after the time looked at (it is loaded), or older than what is loaded.
  const pending=selected&&!picked?snapshot.exchanges.find(x=>x.channel+':'+x.id===selected):undefined
  const pendingAt=pending?firstAt(pending):''
  const later=!!pending&&!!through&&Date.parse(pendingAt)>Date.parse(through)
  const told=useRef('')
  useEffect(()=>{if(!onProjection)return;const key=projectionKey(projection);if(key===told.current)return;told.current=key;const {exchange:_,...out}=projection;onProjection(out)})
  const actor=snapshot.members.find(m=>m.id===member)
  const related=member?exchanges.filter(x=>x.from===member||x.to===member):exchanges
  const label=(id?:string,role:'sender'|'recipient'|'member'='member')=>snapshot.members.find(m=>m.id===id)?.label??id??'Unknown '+role
  const choose=(id:string)=>{setSelected(id);onSelected?.(id);setPanel('exchange')}
  const focus=(id:string)=>{setMember(id);setPanel('member');const x=exchanges.find(e=>e.from===id||e.to===id);if(x){setSelected(x.channel+':'+x.id);onSelected?.(x.channel+':'+x.id)}}
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setPanel(null)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
  const issueRows=exchanges.filter(x=>x.issue)
  const shown=picked??pending
  const sceneIds=new Set([member,shown?.from,shown?.to].filter(Boolean))
  const scene={...snapshot,exchanges,members:snapshot.members.filter(m=>sceneIds.has(m.id)).map(m=>through?{...m,activity:undefined}:m)}
  const membership=(id?:string)=>snapshot.members.find(m=>m.id===id)?.memberships.map(m=>m.organization+' / '+(m.domain??'No domain')+' · '+m.role).join(' · ')||'Not in the seat roster'
  const groups=new Map<string,typeof snapshot.members>()
  const domainOf=new Map<string,string|null>()
  for(const m of snapshot.members){if(!(m.label+' '+membership(m.id)).toLowerCase().includes(search.toLowerCase()))continue;const seat=m.memberships[0];const key=seat?seat.organization+' / '+(seat.domain??'No domain'):'Not in the seat roster';domainOf.set(key,seat?.domain??null);groups.set(key,[...(groups.get(key)??[]),m])}
  // Unknown says why: a seat with no domain in the roster, or a domain with no glyph chosen yet.
  const mark=(domain?:string|null)=>{if(!glyphOf)return null;const g=domain?glyphOf(domain):undefined;return g?<span className="agent-domain-glyph"><Glyph name={g} size={14} title={domain+' domain'}/></span>:<span className="agent-domain-glyph is-unknown" title={domain?'No glyph is chosen for the '+domain+' domain yet':'The seat roster places this seat in no domain'}>{domain?'no glyph':'no domain'}</span>}
  return <main className={'agent-world'+(framed?' is-framed':'')} style={worldVars()} aria-label="Agents observation mode" data-requested-exchange={selected||undefined} data-resolved-exchange={picked?picked.channel+':'+picked.id:undefined} data-selection-state={selected&&!picked?'missing':picked?'resolved':'empty'}>
    <div className="agent-world-space"><CollaborationScene snapshot={scene} selected={picked} pending={pending} focusedMember={member} historical={Boolean(through)} onSelect={choose} onMember={focus}/></div>
    <header className="agent-world-top"><div className="agent-world-title">{!framed&&<span>BIFROST / AGENTS</span>}<strong>Who is working with whom?</strong></div>{!framed&&<nav aria-label="Observation mode"><span aria-current="page">Agents</span><a href={cityHref}>City</a><a href={consoleHref}>Console</a></nav>}</header>
    <section className="agent-world-observer" aria-label="Observation scope">
      <button className={'agent-coverage '+(snapshot.coverage.state==='error'?'is-error':'')} onClick={()=>setPanel('coverage')}>{notice??(snapshot.coverage.state==='ready'?'Recorded observations':snapshot.coverage.state==='error'?'Unknown · the ledger read failed':'Reading evidence…')}</button>
      <div className="agent-world-scope"><select aria-label="Communication channel" value={channel} onChange={e=>{setChannel(e.target.value as 'message'|'event');setPanel(null)}}><option value="message">Agent messages</option><option value="event">Event deliveries</option></select><button onClick={()=>{setMember('');setPanel(null)}}>All communications</button></div>
      {issueRows.map(x=><button className="agent-world-issue" key={x.channel+':'+x.id} onClick={()=>{setChannel(x.channel);choose(x.channel+':'+x.id)}}><b>! {x.issue!.label}</b><span>{label(x.from)} → {label(x.to)}</span></button>)}
    </section>
    {controls&&<div className="agent-world-demo">{controls}</div>}
    <aside className="agent-directory" aria-label="People and departments"><label>Find a person or department<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…"/></label><p>Grouped by primary membership. Select a person to see all their roles and collaborators.</p>{[...groups].map(([name,members])=><section key={name}><h2>{mark(domainOf.get(name))}{name}</h2>{members.map(m=><button key={m.id} aria-label={m.label} aria-pressed={member===m.id} onClick={()=>focus(m.id)}><img src={memberPortrait(m.id)} alt=""/><span><strong>{m.label}</strong><small>{m.memberships[0]?.role??'Unresolved'}{m.memberships.length>1?' · '+m.memberships.length+' memberships':''}</small></span></button>)}</section>)}</aside>
    <div className="agent-world-caption"><span>{through?'HISTORICAL COMMUNICATION':'LIVE OBSERVATION · REFRESHES EVERY 15s'}</span>{picked?<><button onClick={()=>choose(picked.channel+':'+picked.id)}>{label(picked.from,'sender')} → {label(picked.to,'recipient')}</button>{picked.summary&&<small className="agent-letter-summary">“{picked.summary}”</small>}<small>{membership(picked.from)} → {membership(picked.to)}</small><small>Line = selected communication, not an organizational reporting line.</small></>
      :later&&pending?<><strong role="status">This letter was sent after the time you are looking at</strong><small>{label(pending.from,'sender')} → {label(pending.to,'recipient')} · {pending.summary??pending.label??'letter'} · {clock(pendingAt)}</small></>
      :pending?<><strong role="status">This letter is hidden by the current filter</strong><small>{label(pending.from,'sender')} → {label(pending.to,'recipient')} · {pending.summary??pending.label??'letter'} · {clock(pendingAt)}</small></>
      :selected?<><strong role="status">This letter is older than the history loaded here</strong><small>{history?.hasOlder?'Load earlier history to reach it.':'It is outside the kept history.'}</small></>
      :<strong role="status">No letters at this time</strong>}{selected&&!picked&&<div className="agent-missing-actions">{later&&<button onClick={()=>setThrough(pendingAt)}>Jump to this letter's time</button>}{pending&&!later&&<button onClick={()=>changeScope({channel:pending.channel,member:''})}>Show all communications</button>}{!pending&&history?.hasOlder&&<button disabled={history.loading} onClick={history.loadOlder}>{history.loading?'Loading earlier…':'Load earlier history'}</button>}<button onClick={()=>{setSelected('');onSelected?.('');setPanel(null)}}>Clear selection</button></div>}</div>
    <CommunicationTimeline snapshot={snapshot} channel={channel} member={member} through={through} onThrough={setThrough} selected={picked?picked.channel+':'+picked.id:''} onSelect={choose} history={history}/>
    {panel&&<aside className="agent-world-panel" aria-label="Observation details"><header><strong>{panel==='member'?'Member':panel==='list'?'Recorded exchanges':panel==='coverage'?'Evidence coverage':'Exchange evidence'}</strong><button aria-label="Close details" onClick={()=>setPanel(null)}>×</button></header>
      {panel==='member'&&actor&&<><h2>{actor.label}</h2><p>{through?'Current activity is not reconstructed in history':actor.activity?.label??'Activity unknown'}</p>{!through&&actor.activity&&<small>{actor.activity.evidence.source} · {actor.activity.evidence.at}</small>}<h3>Ownership & membership</h3>{actor.memberships.length?actor.memberships.map((m,i)=><p key={i}>{mark(m.domain)}{m.organization} / {m.domain??'No domain'}<br/><small>{m.seat} · {m.role}{m.invitedBy?' · invited by '+m.invitedBy:''}</small></p>):<p>Not in the seat roster</p>}<MemberDossier member={actor} asOf={snapshot.coverage.updatedAt} through={through}/><h3>Observed collaboration · {related.length} letters / events</h3><p>Select a communication to inspect the two participants, their departments and the evidence timeline.</p>{related.map(x=><button className="agent-record" key={x.channel+':'+x.id} onClick={()=>choose(x.channel+':'+x.id)}>{x.label}<small>{label(x.from)} → {label(x.to)}</small></button>)}{!related.length&&<p>No exchanges in the loaded window. This does not establish inactivity.</p>}</>}
      {panel==='list'&&<>{exchanges.map(x=><button className="agent-record" key={x.channel+':'+x.id} onClick={()=>choose(x.channel+':'+x.id)}>{x.issue?'! ':''}{x.label}<small>{label(x.from)} → {label(x.to)}</small></button>)}{!exchanges.length&&<p>No exchanges observed in the loaded window.</p>}</>}
      {panel==='exchange'&&picked&&<><small>{picked.channel} · {picked.id}</small><h2>{picked.summary??picked.label}</h2>{picked.summary&&<small>{picked.label}</small>}<p>{label(picked.from)} → {label(picked.to)}</p>{picked.issue&&<div className="comm-issue"><strong>! {picked.issue.label}</strong><small>{picked.issue.evidence.source} · {picked.issue.evidence.id} · {picked.issue.evidence.at}</small></div>}<ReplyTrail exchange={picked} exchanges={visible} asOf={through||snapshot.coverage.updatedAt} onSelect={choose}/><dl>{STAGES.map(stage=><div key={stage}><dt>{STAGE_LABEL[stage]}</dt><dd>{picked.stages[stage]?.map(e=><details key={e.id}><summary>{new Date(e.at).toLocaleTimeString()}</summary><small>{e.source} · {e.id}{e.actor?' · '+e.actor:''}</small></details>)??'Not observed'}</dd></div>)}</dl><p className="agent-help">Delivery, ACK, acceptance and completion are separate evidence. Reading changes no message state.</p></>}
      {panel==='coverage'&&<><p>{snapshot.coverage.note}</p><p>Last successful read: {snapshot.coverage.updatedAt??'Not observed'}</p>{snapshot.coverage.truncated&&<p>This is a bounded window, not complete history.</p>}<p>Position represents organizational membership, not physical location. Movement represents newly observed evidence, not continuous activity.</p></>}
    </aside>}
  </main>
}
