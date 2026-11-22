import { useState } from 'react'
import { ArrowRight, Mail, Users, List, LayoutGrid } from 'lucide-react'
import { evidenceThrough, STAGES, STAGE_LABEL, type CommunicationSnapshot, type Exchange } from './model'
import './communication.css'

export function WorkingStudio({ snapshot, stationImage }: { snapshot: CommunicationSnapshot; stationImage: string }) {
  const [selected, select] = useState<string | null>(null)
  const [member, focus] = useState<string>('')
  const [layout, setLayout] = useState<'studio' | 'ledger'>('studio')
  const [channel, setChannel] = useState<'message' | 'event'>('message')
  const [through, setThrough] = useState('')
  const observed = evidenceThrough(snapshot.exchanges, through)
  const exchanges = observed.filter(x => x.channel === channel && (!member || x.from === member || x.to === member))
  const picked = exchanges.find(x => x.channel + ':' + x.id === selected) ?? exchanges[0]
  const label = (id?: string) => snapshot.members.find(m => m.id === id)?.label ?? id ?? 'Unknown member'
  const groups = new Map<string, typeof snapshot.members>()
  for (const m of snapshot.members) {
    if (channel === 'event' ? !exchanges.some(x => x.from === m.id || x.to === m.id) : !m.memberships.length && !snapshot.exchanges.some(x => x.channel === 'message' && (x.from === m.id || x.to === m.id))) continue
    const keys = m.memberships.length ? [...new Set(m.memberships.map(s => s.organization + ' / ' + (s.domain ?? 'Outside domains')))] : ['Unresolved membership']
    for (const key of keys) groups.set(key, [...(groups.get(key) ?? []), m])
  }
  const exchangeButton = (x: Exchange) => <button key={x.channel + ':' + x.id} className="comm-exchange" aria-pressed={picked === x} onClick={() => select(x.channel + ':' + x.id)}>
    <Mail size={16} /><span><strong>{x.label}</strong><small>{label(x.from)} → {label(x.to)}</small></span><span>{x.channel === 'event' ? (x.stages.delivered ? 'Delivery observed' : 'Delivery not observed') : (x.stages.acknowledged ? 'ACK observed' : 'ACK not observed')}</span>
  </button>
  return <section className="comm-studio" aria-label="Agent collaboration">
    <div className="comm-verdict" role="status"><span>{snapshot.coverage.state === 'ready' ? 'Recorded exchanges' : snapshot.coverage.state === 'error' ? 'Observation unavailable' : 'Reading communication evidence…'}</span><small>{snapshot.coverage.updatedAt ? 'Last read ' + new Date(snapshot.coverage.updatedAt).toLocaleTimeString() : 'No successful read yet'}</small></div>
    <div className="comm-toolbar"><label>Channel <select aria-label="Communication channel" value={channel} onChange={e => { setChannel(e.target.value as 'message' | 'event'); focus('') }}><option value="message">Agent messages</option><option value="event">Event deliveries</option></select></label><p>Observe members working together. Reading changes no message state.</p><div><button aria-pressed={layout === 'studio'} onClick={() => setLayout('studio')}><LayoutGrid size={16} /> Studio</button><button aria-pressed={layout === 'ledger'} onClick={() => setLayout('ledger')}><List size={16} /> Ledger</button></div></div>
    <form className="comm-history" onSubmit={event => { event.preventDefault(); setThrough(String(new FormData(event.currentTarget).get('through') ?? '')) }}><label>Evidence through <input aria-label="Evidence through" type="datetime-local" name="through" key={through} defaultValue={through} /></label><button type="submit">Apply time</button>{through && <button type="button" onClick={() => setThrough('')}>Return to latest</button>}<small>Filter retained evidence; not a replay of member presence.</small></form><p className="comm-note">{snapshot.coverage.note}{snapshot.coverage.truncated ? ' This is a bounded window, not the complete history.' : ''}</p>
    <div className="comm-columns"><div>
      {layout === 'studio' && [...groups].map(([name, members]) => <section className="comm-domain" key={name}><h3><Users size={18} />{name}</h3><div className="comm-stations">{members.map(m => <button className="comm-station" key={m.id} aria-pressed={member === m.id} onClick={() => focus(member === m.id ? '' : m.id)}>
        <img src={stationImage} alt="" /><strong>{m.label}</strong><small>{[...new Set(m.memberships.filter(s => name === s.organization + ' / ' + (s.domain ?? 'Outside domains')).map(s => s.role))].join(' · ') || 'Membership not resolved'}</small><span title={m.activity ? m.activity.evidence.source + ' · ' + m.activity.evidence.at : undefined}>{m.activity ? 'Reported: ' + m.activity.label : 'Activity unknown'}</span>
      </button>)}</div></section>)}
      <section className="comm-exchanges"><div className="comm-listhead"><h3>{member ? 'Exchanges involving ' + label(member) : 'Observed exchanges'}</h3>{member && <button onClick={() => focus('')}>Clear member</button>}</div>
        {exchanges.length ? exchanges.map(exchangeButton) : <p>No exchanges observed in the loaded window. This does not establish inactivity.</p>}
      </section>
    </div><aside className="comm-inspector" aria-label="Exchange evidence">
      <h3>Exchange evidence</h3>{picked ? <><small>{picked.channel} · {picked.id}</small><h4>{picked.label}</h4><p className="comm-direction">{label(picked.from)} <ArrowRight size={16} /> {label(picked.to)}</p>
      <dl>{STAGES.map(stage => <div key={stage}><dt>{STAGE_LABEL[stage]}</dt><dd>{picked.stages[stage]?.map(e => <details key={e.id}><summary>{new Date(e.at).toLocaleString()}</summary><small>{e.source}<br />{e.id}{e.actor ? ' · ' + e.actor : ''}</small></details>) ?? <span className="comm-unknown">Not observed</span>}</dd></div>)}</dl>
      <p className="comm-note">Delivery, ACK, acceptance and completion are separate facts. Missing evidence is not a rejection or failure.</p></> : <p>Select an exchange when evidence is available.</p>}
    </aside></div>
  </section>
}
