import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Path } from '../city/places'
import { pathKey, type ObservationContext, type ObservationSnapshot } from '../observation/model'
import type { ObjectRef, WorldTime } from '../city/world'

type Pin = { snapshot: ObservationSnapshot; at: string }

/**
 * The one time model for the frame (world.ts WorldTime; 箭10 2026-11-23: the journey bar joins Signals and Console on
 * it). Live: the newest time a source said for its reading (evaluated, else received); none: not known, never the
 * render time. Pinned: the snapshot's capture time, fixed at the moment the viewer pinned it.
 */
export function worldTimeOf(snapshot: ObservationSnapshot, pinnedAt: string | null): WorldTime {
  if (pinnedAt) return { mode: 'pinned', at: snapshot.capturedAt, since: pinnedAt }
  let best: string | undefined
  for (const reads of Object.values(snapshot.evidence)) for (const r of reads) {
    const t = r.evaluatedAt ?? r.receivedAt
    if (t && Number.isFinite(Date.parse(t)) && (!best || Date.parse(t) > Date.parse(best))) best = t
  }
  return best ? { mode: 'live', at: best } : { mode: 'live' }
}

/** The selection as the world's typed reference (D1): a place in the City tree, by its path. */
export const placeRef = (path: Path): ObjectRef => ({ kind: 'place', key: pathKey(path) })
/** Local observation state. Keep this hook above view navigation to retain context across renderers.
 * Inputs are immutable snapshots from the host; this hook never fetches, persists or reconstructs history.
 */
export function useObservationContext(latest: ObservationSnapshot, initialSelection: Path = []) {
  const [selected, setSelected] = useState<Path>(() => [...initialSelection])
  const [metrics, setMetrics] = useState(true)
  const [fixed, setFixed] = useState<Pin | null>(null)
  const [now, setNow] = useState(() => new Date().toISOString())
  useEffect(() => {
    if (fixed) return
    const tick = () => setNow(new Date().toISOString())
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [fixed])
  const select = useCallback((path: Path) => setSelected([...path]), [])
  const pin = useCallback(() => setFixed({ snapshot: latest, at: new Date().toISOString() }), [latest])
  const resume = useCallback(() => { setNow(new Date().toISOString()); setFixed(null) }, [])
  const context: ObservationContext = useMemo(() => ({ selected, metrics, at: fixed?.at ?? now }), [selected, metrics, fixed, now])
  const shown = fixed?.snapshot ?? latest
  const time = useMemo(() => worldTimeOf(shown, fixed?.at ?? null), [shown, fixed])
  const ref = useMemo(() => placeRef(selected), [selected])
  return { snapshot: shown, latest, context, pinned: fixed !== null, select, setMetrics, pin, resume, time, ref }
}
