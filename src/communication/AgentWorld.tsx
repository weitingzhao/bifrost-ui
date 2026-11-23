import { useEffect, useState, type ReactNode } from 'react'
import { OfficeWorld } from './OfficeWorld'
import { STAGES, STAGE_LABEL, type CommunicationSnapshot } from './model'
import './communication.css'

type Props = {
  snapshot: CommunicationSnapshot; stationImage: string;
  cityHref: string; consoleHref: string; selectedId?: string;
  onSelected?: (id: string) => void; controls?: ReactNode; notice?: string;
}
/** Peer observation mode: the world is the screen; records are opened on demand. */
export function AgentWorld({snapshot, stationImage, cityHref, consoleHref, selectedId, onSelected, controls, notice}: Props) {
  const [selected,setSelected]=useState(selectedId ?? '')
  const [member,setMember]=useState('')
  const [panel,setPanel]=useState<'member'|'exchange'|'list'|'coverage'|null>(null)
  const [channel,setChannel]=useState<'message'|'event'>(selectedId?.startsWith('event:')?'event':'message')
  useEffect(()=>{if(selectedId){setSelected(selectedId);setChannel(selectedId.startsWith('event:')?'event':'message')}},[selectedId])
  const exchanges=snapshot.exchanges.filter(x=>x.channel===channel)
  const picked=exchanges.find(x=>x.channel+':'+x.id===selected)??exchanges[0]
  const actor=snapshot.members.find(m=>m.id===member)
  const related=member?exchanges.filter(x=>x.from===member||x.to===member):exchanges
  const label=(id?:string)=>snapshot.members.find(m=>m.id===id)?.label??id??'Unknown member'
  const choose=(id:string)=>{setMember('');setSelected(id);onSelected?.(id);setPanel('exchange')}
  const focus=(id:string)=>{setMember(id);setPanel('member');const x=exchanges.find(e=>e.from===id||e.to===id);if(x){setSelected(x.channel+':'+x.id);onSelected?.(x.channel+':'+x.id)}}
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setPanel(null)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
  const issueRows=snapshot.exchanges.filter(x=>x.issue)
  return <main className="agent-world" aria-label="Agents observation mode">
    <div className="agent-world-space"><OfficeWorld immersive focusedMember={member} snapshot={{...snapshot,exchanges}} image={stationImage} selected={member ? related.find(x=>x.channel+':'+x.id===selected)??related[0] : picked} onSelect={choose} onMember={focus}/></div>
    <header className="agent-world-top"><div className="agent-world-title"><span>BIFROST / AGENTS</span><strong>Work happens between people.</strong></div><nav aria-label="Observation mode"><span aria-current="page">Agents</span><a href={cityHref}>City</a><a href={consoleHref}>Console</a></nav></header>
    <section className="agent-world-observer" aria-label="Observation scope">
      <button className={'agent-coverage '+(snapshot.coverage.state==='error'?'is-error':'')} onClick={()=>setPanel('coverage')}>{notice??(snapshot.coverage.state==='ready'?'Recorded observations':snapshot.coverage.state==='error'?'Observation unavailable':'Reading evidence…')}</button>
      <div className="agent-world-scope"><select aria-label="Communication channel" value={channel} onChange={e=>{setChannel(e.target.value as 'message'|'event');setMember('');setPanel(null)}}><option value="message">Agent messages</option><option value="event">Event deliveries</option></select><button onClick={()=>{setMember('');setPanel(null)}}>Everyone</button></div>
      {issueRows.map(x=><button className="agent-world-issue" key={x.channel+':'+x.id} onClick={()=>{setChannel(x.channel);choose(x.channel+':'+x.id)}}><b>! {x.issue!.label}</b><span>{label(x.from)} → {label(x.to)}</span></button>)}
    </section>
    {controls&&<div className="agent-world-demo">{controls}</div>}
    <div className="agent-world-caption"><span>{picked?'FOCUSED EXCHANGE':'OBSERVATION'}</span><button onClick={()=>picked&&choose(picked.channel+':'+picked.id)}>{picked?label(picked.from)+' → '+label(picked.to):'No exchanges observed'}</button><small>{picked?.label??'Unknown is not inactivity.'}</small></div>
    <footer className="agent-world-dock"><div className="agent-world-members" aria-label="Members">{snapshot.members.map(m=><button key={m.id} aria-pressed={member===m.id} onClick={()=>focus(m.id)}><img src={stationImage} alt=""/><span>{m.label}</span></button>)}</div><button className="agent-exchanges-button" onClick={()=>setPanel('list')}>Exchanges <span>{exchanges.length}</span></button></footer>
    {panel&&<aside className="agent-world-panel" aria-label="Observation details"><header><strong>{panel==='member'?'Member':panel==='list'?'Recorded exchanges':panel==='coverage'?'Evidence coverage':'Exchange evidence'}</strong><button aria-label="Close details" onClick={()=>setPanel(null)}>×</button></header>
      {panel==='member'&&actor&&<><h2>{actor.label}</h2><p>{actor.activity?.label??'Activity unknown'}</p>{actor.activity&&<small>{actor.activity.evidence.source} · {actor.activity.evidence.at}</small>}<h3>Ownership & membership</h3>{actor.memberships.length?actor.memberships.map((m,i)=><p key={i}>{m.organization} / {m.domain??'Outside domains'}<br/><small>{m.seat} · {m.role}{m.invitedBy?' · invited by '+m.invitedBy:''}</small></p>):<p>Membership unresolved</p>}<h3>Observed collaboration</h3>{related.map(x=><button className="agent-record" key={x.channel+':'+x.id} onClick={()=>choose(x.channel+':'+x.id)}>{x.label}<small>{label(x.from)} → {label(x.to)}</small></button>)}{!related.length&&<p>No exchanges in the loaded window. This does not establish inactivity.</p>}</>}
      {panel==='list'&&<>{exchanges.map(x=><button className="agent-record" key={x.channel+':'+x.id} onClick={()=>choose(x.channel+':'+x.id)}>{x.issue?'! ':''}{x.label}<small>{label(x.from)} → {label(x.to)}</small></button>)}{!exchanges.length&&<p>No exchanges observed in the loaded window.</p>}</>}
      {panel==='exchange'&&picked&&<><small>{picked.channel} · {picked.id}</small><h2>{picked.label}</h2><p>{label(picked.from)} → {label(picked.to)}</p>{picked.issue&&<div className="comm-issue"><strong>! {picked.issue.label}</strong><small>{picked.issue.evidence.source} · {picked.issue.evidence.id} · {picked.issue.evidence.at}</small></div>}<dl>{STAGES.map(stage=><div key={stage}><dt>{STAGE_LABEL[stage]}</dt><dd>{picked.stages[stage]?.map(e=><details key={e.id}><summary>{new Date(e.at).toLocaleTimeString()}</summary><small>{e.source} · {e.id}{e.actor?' · '+e.actor:''}</small></details>)??'Not observed'}</dd></div>)}</dl><p className="agent-help">Delivery, ACK, acceptance and completion are separate evidence. Reading changes no message state.</p></>}
      {panel==='coverage'&&<><p>{snapshot.coverage.note}</p><p>Last successful read: {snapshot.coverage.updatedAt??'Not observed'}</p>{snapshot.coverage.truncated&&<p>This is a bounded window, not complete history.</p>}<p>Position represents organizational membership, not physical location. Movement represents newly observed evidence, not continuous activity.</p></>}
    </aside>}
  </main>
}
