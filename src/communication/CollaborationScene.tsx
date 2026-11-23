import { useEffect, useRef, useState } from 'react'
import { memberHue, workstation } from './cityArt'
import { spriteUrl } from '../city/sprites'
import { lastAt, type CommunicationSnapshot, type Exchange } from './model'
type Props={snapshot:CommunicationSnapshot; selected?:Exchange; focusedMember:string; historical:boolean; onMember:(id:string)=>void; onSelect:(id:string)=>void}
/** A local collaboration lens, using City's existing drawing kit, never a simulated workflow. */
export function CollaborationScene({snapshot,selected,focusedMember,historical,onMember,onSelect}:Props){
 const ids=[...new Set([selected?.from,selected?.to,focusedMember].filter((id):id is string=>Boolean(id)))].slice(0,3)
 const members=ids.flatMap(id=>{const m=snapshot.members.find(m=>m.id===id);return m?[m]:[]})
 const seen=useRef(new Set<string>()),initialized=useRef(false)
 const [pulse,setPulse]=useState('')
 useEffect(()=>{const keys=new Set(snapshot.exchanges.map(x=>x.channel+x.id+lastAt(x)));const key=selected?selected.channel+selected.id+lastAt(selected):'';if(initialized.current&&key&&!seen.current.has(key)&&!historical)setPulse(key);seen.current=keys;initialized.current=true},[snapshot.exchanges,selected,historical])
 const positions=members.map((_,i)=>({x:members.length===1?50:members.length===2?27+i*46:18+i*32,y:48}))
 return <section className="agent-city-scene" aria-label="Collaboration workspace">
  <div className="agent-scene-ground"/>
  {members.length>1&&selected&&<svg className="agent-scene-links" viewBox="0 0 1000 500" aria-label="Selected communication path"><defs><marker id="agent-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="currentColor"/></marker></defs><path key={pulse} className={!historical&&pulse?'agent-evidence-pulse':''} d={`M ${positions[0].x*10} 185 Q 500 20 ${positions[1].x*10} 185`} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={selected.stages.delivered?undefined:'7 6'} markerEnd="url(#agent-arrow)"/></svg>}
  {members.map((m,i)=><button className="agent-city-station" style={{left:positions[i].x+'%',top:positions[i].y+'%'}} key={m.id} aria-label={'Inspect '+m.label} onClick={()=>onMember(m.id)}><img src={spriteUrl(workstation(m.id))} alt=""/><span className="agent-station-name" style={{borderTopColor:memberHue(m.id)}}><strong>{m.label}</strong><small>{m.memberships[0]?m.memberships[0].organization+' / '+(m.memberships[0].domain??'Outside domains'):'Membership unresolved'}</small><small>{m.memberships[0]?.role??'Unresolved role'}{m.memberships.length>1?' · '+m.memberships.length+' memberships':''}</small>{!historical&&<small className="agent-station-work">{m.work?.doing||m.activity?.label||'Current work not reported'}</small>}</span></button>)}
  {selected&&<button className="agent-scene-exchange" onClick={()=>onSelect(selected.channel+':'+selected.id)}><strong>{selected.issue?'! '+selected.issue.label:selected.label}</strong><span>Inspect communication →</span></button>}
  {!members.length&&<p className="agent-scene-empty">Select a member to explore their work and collaborations.</p>}
  <p className="agent-scene-legend">Solid path: {selected?.channel==='event'?'consumer receipt':'inbox evidence'} · Dashed: delivery not observed · Color identifies a member, not status</p>
 </section>
}
