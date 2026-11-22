import { useEffect, useState } from 'react'
import { CardView } from '../city/CardView'
import { meterText, type Path } from '../city/places'
import { objectsIn, pathKey, readQuality, type ObservationSnapshot, type ObservationView, type ObservationLayer, type ObservationPanel } from './model'
import { anomalyLayer, readingView, statusView } from './views'

export type ObservationSurfaceProps = {
  snapshot: ObservationSnapshot
  views?: readonly ObservationView[]
  layers?: readonly ObservationLayer[]
  initialSelection?: Path
}
const DEFAULT_VIEWS = [readingView, statusView]
const DEFAULT_LAYERS = [anomalyLayer]
/** Display state only: pinning retains a snapshot reference while the parent's acquisition keeps running. */
export function ObservationSurface({ snapshot, views = DEFAULT_VIEWS, layers = DEFAULT_LAYERS, initialSelection = [] }: ObservationSurfaceProps) {
  const [viewId, setView] = useState(views[0]?.id ?? '')
  const [selected, select] = useState(initialSelection)
  const [enabled, setEnabled] = useState<string[]>(['anomalies'])
  const [metrics, setMetrics] = useState(true)
  const [skin, setSkin] = useState('paper')
  const [motion, setMotion] = useState(false)
  const [pinned, pin] = useState<ObservationSnapshot | null>(null)
  const [now, tick] = useState(() => new Date().toISOString())
  useEffect(() => { const timer = setInterval(() => tick(new Date().toISOString()), 1000); return () => clearInterval(timer) }, [])
  const shown = pinned ?? snapshot
  const at = pinned ? pinned.capturedAt : now
  const context = { selected, metrics, at }
  const view = views.find(v => v.id === viewId) ?? views[0]
  const key = pathKey(selected)
  const object = objectsIn(shown.content.tree).find(r => pathKey(r.path) === key)
  const incoming = pinned ? objectsIn(snapshot.content.tree).find(r => pathKey(r.path) === key) : undefined
  const reads = shown.evidence[key] ?? []
  const open = (id: string) => select(id.split('/').filter(Boolean).map(decodeURIComponent))
  const panels = (items: ObservationPanel[]) => items.map(p => <section key={p.id} className="ob-panel"><h2>{p.label}</h2><CardView body={p.blocks} open={open} /></section>)
  return <main className="ob-surface" data-skin={skin} data-motion={motion}>
    <style>{STYLE}</style>
    <header><div><small>OPERATIONS · OBSERVATION</small><h1>Runtime observation</h1><p>{shown.provenance === 'fixture' ? 'SIMULATED FIXTURE' : shown.provenance === 'recorded' ? 'RECORDED REAL RESPONSE · not live' : pinned ? 'PINNED REAL RESPONSE · background reads continue' : 'LIVE READS'} · Snapshot {shown.capturedAt}</p></div><span className="ob-badge">Read-only</span></header>
    <div className="ob-toolbar" aria-label="Observation controls">
      <nav aria-label="Main view">{views.map(v => <button key={v.id} aria-pressed={v.id === view?.id} onClick={() => setView(v.id)}>{v.label}</button>)}</nav>
      <label><input type="checkbox" checked={metrics} onChange={e => setMetrics(e.target.checked)} />Measurements</label>
      {layers.map(l => <label key={l.id} title={l.unavailable}><input type="checkbox" checked={enabled.includes(l.id)} disabled={!!l.unavailable} onChange={e => setEnabled(e.target.checked ? [...enabled, l.id] : enabled.filter(id => id !== l.id))} />{l.label}</label>)}
      <label>Skin <select aria-label="Skin" value={skin} onChange={e => setSkin(e.target.value)}><option value="paper">Paper</option><option value="night">Night</option></select></label>
      <label><input type="checkbox" checked={motion} onChange={e => setMotion(e.target.checked)} />Transitions</label>
      <button onClick={() => pin(pinned ? null : snapshot)}>{pinned ? 'Return to live context' : 'Pin this snapshot'}</button>
    </div>
    <p className="ob-context">{pinned ? 'Pinned observation; background acquisition continues. No historical reconstruction.' : 'Latest supplied snapshot.'} {layers.filter(l => l.unavailable).map(l => `${l.label}: ${l.unavailable}`).join(' ')}</p>
    {pinned && <p aria-label="Incoming snapshot">Latest incoming snapshot: {snapshot.capturedAt}. Selected object now: {incoming ? `${incoming.place.state ?? 'unknown'} · ${meterText(incoming.place.meter) ?? 'Not measured'}` : 'Not represented'}. Pinned evidence below is unchanged.</p>}
    <div className="ob-layout"><div><div className={view?.id === 'status' ? 'ob-field' : ''}>{view ? panels(view.present(shown, context)) : <p>No main view registered.</p>}</div>
      {layers.filter(l => enabled.includes(l.id) && !l.unavailable).map(l => <div key={l.id} aria-label={l.label}>{panels(l.present(shown, context))}</div>)}
    </div><aside className="ob-panel" aria-label="Selected object evidence"><h2>Evidence inspector</h2><p className="ob-path">{key || '(root)'}</p>
      {!object ? <p>Selected object is not represented in this snapshot. Selection retained.</p> : <CardView body={[{ kind: 'facts', rows: [
        { label: 'Object', value: object.place.label }, { label: 'State from adapter', value: object.place.state ?? 'unknown' },
        { label: 'Measurement', value: meterText(object.place.meter) ?? 'Not measured' }, { label: 'Quality', value: readQuality(reads, at) },
        ...(object.place.meter ? [{ label: 'Raw value / capacity', value: `${object.place.meter.used ?? 'unknown'} / ${object.place.meter.of ?? 'unknown'} ${object.place.meter.unit}` }] : []),
        { label: 'Snapshot ID', value: shown.id }, { label: 'Context time', value: at },
      ] }]} />}
      {reads.length === 0 && <p>Source or measurement time is not supplied. Unknown.</p>}
      {reads.map((r, i) => <details key={r.source + i} open><summary>{r.outcome} · {r.detail ?? 'Source evidence'}</summary><CardView body={[{ kind: 'facts', rows: [
        { label: 'Source', value: r.source }, { label: 'Evaluation time', value: r.evaluatedAt ?? 'Unknown (not scrape time)' },
        { label: 'Received at', value: r.receivedAt }, { label: 'Refresh deadline', value: r.expiresAt ?? 'Not supplied' },
      ] }]} /></details>)}
      <p>Measurements, monitoring judgments and communication evidence are separate. No handling activity is inferred.</p>
    </aside></div>
  </main>
}
const STYLE = `
.ob-surface{--ob-bg:#f4f5f2;--ob-panel:#fff;--ob-ink:#202b31;--ob-muted:#586970;--ob-line:#dce2df;--ob-accent:#0b6a62;background:var(--ob-bg);color:var(--ob-ink);min-height:100vh;padding:28px;font:14px/1.5 system-ui,sans-serif;box-sizing:border-box}
.ob-surface[data-skin=night]{--ob-bg:#111c24;--ob-panel:#1b2a34;--ob-ink:#e6edef;--ob-muted:#b0c3cd;--ob-line:#374952;--ob-accent:#7edcc9}
.ob-surface *{box-sizing:border-box}.ob-surface header{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:22px}.ob-surface h1{font-size:28px;font-weight:600;margin:4px 0}.ob-surface h2{font-size:15px;margin:0 0 14px}.ob-surface p{color:var(--ob-muted);margin:8px 0}.ob-surface small{letter-spacing:.1em;color:var(--ob-accent)}
.ob-badge{border:1px solid var(--ob-line);border-radius:20px;padding:6px 14px}.ob-toolbar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:14px 0;border-block:1px solid var(--ob-line)}.ob-toolbar nav{display:flex;gap:6px}.ob-toolbar label{display:flex;gap:6px;align-items:center}.ob-surface button,.ob-surface select{font:inherit;color:inherit;background:var(--ob-panel);border:1px solid var(--ob-line);border-radius:7px;padding:8px 12px;cursor:pointer}.ob-surface button[aria-pressed=true]{background:var(--ob-accent);color:var(--ob-bg)}.ob-surface button:focus-visible,.ob-surface select:focus-visible,.ob-surface input:focus-visible{outline:3px solid var(--ob-accent);outline-offset:3px}.ob-context{padding:8px 0}.ob-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(290px,360px);gap:18px;align-items:start}.ob-field{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.ob-panel{padding:18px;background:var(--ob-panel);border:1px solid var(--ob-line);border-radius:10px;margin-bottom:14px;overflow:auto}.ob-surface .g2-table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}.ob-surface th,.ob-surface td{padding:9px 6px;text-align:left;border-bottom:1px solid var(--ob-line);vertical-align:top;overflow-wrap:anywhere}.ob-surface th{font-size:12px;color:var(--ob-muted);font-weight:500}.ob-surface .g2-link{border:0;padding:0;background:none;color:var(--ob-accent);text-align:left}.ob-surface .g2-unknown{color:var(--ob-muted)}.ob-surface .g2-warn{color:#c5752b}.ob-surface details{margin-top:18px}.ob-surface summary{cursor:pointer}.ob-path{overflow-wrap:anywhere;font-family:monospace}.ob-surface[data-motion=true] .ob-panel{transition:background-color .18s,border-color .18s}@media(max-width:900px){.ob-layout{grid-template-columns:1fr}.ob-surface{padding:16px}}@media(prefers-reduced-motion:reduce){.ob-surface .ob-panel{transition:none!important}}
`
