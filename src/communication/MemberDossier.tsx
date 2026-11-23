import type { Member } from './model'
export function MemberDossier({member,asOf,through}:{member:Member;asOf?:string;through?:string}){
 const w=member.work
 const age=w&&asOf?Math.max(0,Math.floor((Date.parse(asOf)-Date.parse(w.evidence.at))/60000)):undefined
 const records=(member.records??[]).filter(r=>!through||Date.parse(r.evidence.at)<=Date.parse(through)).sort((a,b)=>b.evidence.at.localeCompare(a.evidence.at))
 return <section className="agent-dossier" aria-label="Work and authority">
  <h3>Current work · latest source report</h3>
  {through?<p>History filters communication and work records. A past work state is not reconstructed from the latest report.</p>:w?<><p className={age!==undefined&&age>=120?'agent-report-stale':''}>{age!==undefined?(age>=120?'Older report · ':'Reported ')+age+' min ago':'Source timestamp below'} · not inferred from mail</p>{w.problem&&<p role="alert">Report could not be interpreted: {w.problem}</p>}<dl>{[['Execution line',w.line],['Declared charter',w.declaredCharter],['Goal',w.goal],['Doing',w.doing],['Waiting on',w.waitingOn],['Next',w.next],['Task binding',w.binding]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Not reported'}</dd></div>)}</dl>{w.progress!==undefined&&<p>Reported progress: {w.progress}%<br/><small>Basis: {w.progressBasis||'Not provided'}</small></p>}<small>{w.evidence.source} · {w.evidence.id} · {new Date(w.evidence.at).toLocaleString()}</small><p>Waiting on one item does not mean all work is stopped. Declared charter is self-reported, not verified membership.</p></>:<p>No current work report linked to this exact identity. Communication does not establish a task assignment.</p>}
  <h3>Authority</h3><p>Effective permissions are not supplied by these sources. Owner / temporary membership describes a role, not an authorization grant.</p>
  <h3>Work records · retained source window</h3>{records.length?records.map(r=><details key={r.evidence.source+':'+r.evidence.id}><summary><time>{new Date(r.evidence.at).toLocaleString()}</time> {r.label}</summary><p>{r.detail}</p><small>{r.evidence.source} · {r.evidence.id}</small>{r.href&&<p><a href={r.href}>Open source records →</a></p>}</details>):<p>No linked work records in this window. This is not a claim that no work exists.</p>}
 </section>
}
