import { Button, ScrollEdge } from '@bifrost/ui'
import { useEffect, useRef } from 'react'

const ROWS = [
  ['NVDA', 'NOV21 170P', '−2', '4.85'],
  ['AAPL', 'NOV21 245C', '−3', '2.10'],
  ['MSFT', 'DEC19 480P', '−1', '6.40'],
  ['AMZN', 'NOV21 200P', '−2', '3.35'],
  ['META', 'DEC19 640P', '−1', '9.80'],
  ['TSLA', 'NOV21 400P', '−1', '7.25'],
  ['GOOGL', 'DEC19 270C', '−2', '1.95'],
  ['AVGO', 'NOV21 330P', '−1', '5.60'],
  ['AMD', 'NOV21 150P', '−3', '2.45'],
  ['NFLX', 'DEC19 1100C', '−1', '12.30'],
  ['COST', 'DEC19 900P', '−1', '8.15'],
  ['JPM', 'NOV21 290P', '−2', '2.70'],
]

/** A toolbar with no fill and no hairline over a scroller. `ScrollEdge` sits in
    the positioned parent at the toolbar's lower edge (`top`) and fades a 60px
    band in once the scroller is past 2px. */
function Frame({ scrolled }: { scrolled: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrolled && ref.current) {
      ref.current.scrollTop = 72
      ref.current.dispatchEvent(new Event('scroll'))
    }
  }, [scrolled])
  return (
    <div className="relative flex h-64 w-96 flex-col overflow-hidden rounded-lg bg-background text-foreground">
      <div className="flex h-10 shrink-0 items-center gap-2 px-4">
        <span className="text-sm font-semibold">Open legs</span>
        <span className="flex-1" />
        <Button size="xs" variant="ghost">Group</Button>
        <Button size="xs">New plan</Button>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-4">
        {ROWS.map(([sym, contract, qty, mark]) => (
          <div key={sym} className="flex items-center gap-3 py-1.5 text-dense-body">
            <span className="w-14 font-mono font-semibold">{sym}</span>
            <span className="flex-1 font-mono tabular-nums">{contract}</span>
            <span className="w-8 text-right font-mono tabular-nums">{qty}</span>
            <span className="w-12 text-right font-mono tabular-nums">{mark}</span>
          </div>
        ))}
      </div>
      <ScrollEdge scrollRef={ref} top={40} />
    </div>
  )
}

/** At rest: neither line nor band under the toolbar. */
export const AtRest = () => <Frame scrolled={false} />

/** Scrolled: the band fades in and the rows blur out under the toolbar. */
export const Scrolled = () => <Frame scrolled />
