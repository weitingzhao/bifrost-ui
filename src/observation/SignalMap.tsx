import { CardView } from '../city/CardView'
import { Glyph } from '../city/worldGlyphs'
import { statusOfQuality, statusOfState } from '../city/world'
import { districtHall, workshop, HUES } from '../city/sprites'
import { meterText, type Path } from '../city/places'
import { objectsIn, pathKey, readQuality, type ObservationSnapshot, type ObservationPanel } from './model'

// The exact SVG drawing kit and palette used for City's Phaser textures. Static textures need no game loop.
const halls = HUES.map((h,i) => 'data:image/svg+xml,' + encodeURIComponent(districtHall(2,2,h,'day',i).svg))
const shops = HUES.map((h,i) => 'data:image/svg+xml,' + encodeURIComponent(workshop(2,2,h,'day',i).svg))
/**
 * A reading's quality as an Ops word (箭10 2026-11-23, brand layer item 5): fresh is ok, past its deadline fail,
 * otherwise unknown (engine's statusOfQuality). The quality's own words stay in the tooltip and the evidence drawer.
 */
function Quality({reads,at}:{reads:Parameters<typeof readQuality>[0];at:string}) {
  const q=readQuality(reads,at), w=statusOfQuality(q)??'ok'
  return <><span className={'sm-word sm-'+w} title={q}>{w}</span> · evidence ↗</>
}
type Props = { snapshot: ObservationSnapshot; at: string; metrics: boolean; onSelect: (p: Path) => void; onEvidence: (p: ObservationPanel) => void }
export function SignalMap({snapshot,at,metrics,onSelect,onEvidence}: Props) {
  const devices = objectsIn(snapshot.content.tree).filter(o => o.place.kind === 'building')
  const regions = [['domains','Domain village','Four source lights per domain'],['ci','CI workshop','Observed runs · retained history · last 24 hours'],['data','Data warehouse','Source verdicts · collection and maintenance']] as const
  return <div className="signal-map">
    {regions.map(([key,label,description],region) => <section className={'sm-region sm-' + key} key={key} aria-label={label}>
      <header><span className="sm-number">0{region+1}</span><h2>{label}</h2><p>{description}</p><span>{snapshot.layerPanels?.[key]?.length ?? '?'} {key === 'domains' ? 'domains' : 'stations'}</span></header>
      <div className="sm-plots">{snapshot.layerPanels?.[key]?.map((p,i) => <article className="sm-plot" key={p.id}>
        <div className="sm-ground"><img src={(key==='domains'?halls:shops)[i%halls.length]} alt="" draggable={false}/><h3>{p.glyph&&<Glyph name={p.glyph} size={13}/>}{p.label}</h3></div>
        <div className="sm-readings"><CardView body={p.blocks}/></div>
        <button className="sm-evidence" onClick={()=>onEvidence(p)}><Quality reads={snapshot.evidence[p.id]??[]} at={at}/></button>
      </article>) ?? <p className="sm-empty">Reading existing source… Unknown until received.</p>}</div>
    </section>)}
    <section className="sm-region sm-infra" aria-label="Infrastructure power yard"><header><span className="sm-number">04</span><h2>Infrastructure power yard</h2><p>Real devices · source readings</p><span>{devices.length} devices</span></header>
      <div className="sm-plots">{devices.map((d,i)=><article className="sm-plot" key={pathKey(d.path)}><div className="sm-ground"><img src={shops[i%shops.length]} alt="" draggable={false}/><h3>{d.place.label}</h3></div><div className="sm-readings"><strong className={'sm-word sm-'+statusOfState(d.place.state)} title={'Place state: '+(d.place.state??'not read')}>{statusOfState(d.place.state)}</strong> <small>{d.place.state ?? 'not read'}</small>{metrics&&d.place.children.map(p=><p key={p.id}><span>{p.label}</span><b>{meterText(p.meter)??p.state??'Not measured'}</b></p>)}</div><button className="sm-evidence" onClick={()=>onSelect(d.path)}><Quality reads={snapshot.evidence[pathKey(d.path)]??[]} at={at}/></button></article>)}</div>
      {!devices.length&&<p className="sm-empty">Device coverage unknown. {snapshot.evidence['']?.[0]?.detail??'No devices returned.'}</p>}
    </section>
    {/* 0.36.0: optional. Shown only when the host supplies workload panels, so older hosts keep four regions. */}
    {snapshot.layerPanels?.workloads&&<section className="sm-region sm-workloads" aria-label="Workload yard"><header><span className="sm-number">05</span><h2>Workload yard</h2><p>Bus-reported workload states · metrics coverage by namespace</p><span>{snapshot.layerPanels.workloads.length} namespaces</span></header>
      <div className="sm-plots">{snapshot.layerPanels.workloads.map((p,i)=><article className="sm-plot" key={p.id}><div className="sm-ground"><img src={shops[i%shops.length]} alt="" draggable={false}/><h3>{p.label}</h3></div><div className="sm-readings"><CardView body={p.blocks}/></div><button className="sm-evidence" onClick={()=>onEvidence(p)}><Quality reads={snapshot.evidence[p.id]??[]} at={at}/></button></article>)}</div>
    </section>}
  </div>
}
