import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Path } from '../city/places'
import type { ObservationContext, ObservationSnapshot } from '../observation/model'

type Pin = { snapshot: ObservationSnapshot; at: string }
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
  return { snapshot: fixed?.snapshot ?? latest, latest, context, pinned: fixed !== null, select, setMetrics, pin, resume }
}
