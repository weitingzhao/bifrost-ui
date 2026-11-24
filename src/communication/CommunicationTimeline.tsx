import { useEffect, useMemo, useState } from 'react'
import { STAGE_LABEL, type CommunicationSnapshot, type Stage } from './model'
export type HistoryControl = { loadOlder: () => void; loading: boolean; hasOlder: boolean; error?: string; note?: string }
type Props = { snapshot: CommunicationSnapshot; channel: 'message'|'event'; member: string; through: string; onThrough: (at: string) => void; selected: string; onSelect: (id: string) => void; history?: HistoryControl }
/** The clock selects recorded evidence. Playback never simulates missing transitions. */
export function CommunicationTimeline({snapshot,channel,member,through,onThrough,selected,onSelect,history}: Props) {
  const [playing,setPlaying]=useState(false)
  const rows=useMemo(()=>snapshot.exchanges.filter(x=>x.channel===channel&&(!member||x.from===member||x.to===member)).flatMap(x=>Object.entries(x.stages).flatMap(([stage,es])=>(es??[]).map(e=>({key:x.channel+':'+x.id+':'+stage+':'+e.id,exchange:x.channel+':'+x.id,x,e,stage:stage as Stage,time:Date.parse(e.at)})))).filter(r=>Number.isFinite(r.time)).sort((a,b)=>a.time-b.time||a.key.localeCompare(b.key)),[snapshot.exchanges,channel,member])
  const times=[...new Set(rows.map(r=>r.time))]
  const start=times[0]??0, end=times.at(-1)??0, current=through?Date.parse(through):end
  const position=times.filter(t=>t<=current).length-1
  const label=(id?:string,role:'sender'|'recipient'='sender')=>snapshot.members.find(m=>m.id===id)?.label??id??'Unknown '+role
  const date=(t:number)=>new Date(t).toLocaleString()
  const seek=(t:number)=>{setPlaying(false);onThrough(new Date(t).toISOString())}
  useEffect(()=>{if(!playing)return;const next=times.find(t=>t>current);if(next===undefined){setPlaying(false);return}const timer=setTimeout(()=>onThrough(new Date(next).toISOString()),1000);return()=>clearTimeout(timer)},[playing,current,times,onThrough])
  const observed=rows.filter(r=>r.time<=current).slice(-40).reverse()
  const newer=through?rows.filter(r=>r.time>current).length:0
  return <section className="agent-timeline" aria-label="Communication history">
    <header><div><strong>{through?'History · fixed time':'Live · following latest'}</strong><small>{through?date(current):snapshot.coverage.updatedAt?'Last read '+new Date(snapshot.coverage.updatedAt).toLocaleString():'Waiting for first read'}{newer?' · '+newer+' later observations':''}</small></div><div className="agent-time-actions"><button onClick={()=>{setPlaying(false);onThrough(through?'':snapshot.coverage.updatedAt||new Date(end).toISOString())}}>{through?'Return to live':'Pause & inspect'}</button><button disabled={!times.length||position<=0} aria-label="Previous observation" onClick={()=>seek(times[Math.max(0,position-1)])}>Previous</button><button disabled={!through||position>=times.length-1} aria-label="Next observation" onClick={()=>seek(times[position+1])}>Next</button><button disabled={!times.length} onClick={()=>{if(!through||position>=times.length-1)onThrough(new Date(start).toISOString());setPlaying(!playing)}}>{playing?'Stop replay':'Replay'}</button>{history&&channel==='message'&&<button disabled={history.loading||!history.hasOlder} onClick={history.loadOlder}>{history.loading?'Loading earlier…':history.hasOlder?'Load earlier history':'Loaded history boundary'}</button>}</div></header>
    <div className="agent-time-range"><time>{start?date(start):'No recorded time'}</time><input type="range" aria-label="Communication time" min={0} max={Math.max(0,times.length-1)} value={Math.max(0,position)} disabled={!times.length} onChange={e=>seek(times[Number(e.target.value)])}/><time>{end?date(end):'—'}</time></div>
    <div className="agent-time-events" aria-label="Recorded timeline events">{observed.map(r=><button key={r.key} aria-pressed={selected===r.exchange} onClick={()=>{seek(r.time);onSelect(r.exchange)}}><time>{date(r.time)}</time><strong>{label(r.x.from,'sender')} → {label(r.x.to,'recipient')}</strong><span>{r.x.summary??r.x.label??(r.x.channel==='event'?'event':'letter')}</span><small>{STAGE_LABEL[r.stage]}</small></button>)}{!observed.length&&<p>No evidence at this time in the loaded range.</p>}</div>
    <small className="agent-time-note">{history?.error?<span role="alert">{history.error}</span>:channel==='event'?'Event receipts cover the retained stream window; earlier event history is not loaded here.':history?.note??'Loaded evidence only; this is not complete history.'} · Latest 40 observations at the selected time. Seats come from a copy of the seat roster; what members were doing is not replayed.</small>
  </section>
}
