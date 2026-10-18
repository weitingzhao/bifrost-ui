import { DenseTag, DetailPane, LayoutProvider } from '@bifrost/ui'

const ROWS = [
  ['2026-10-14', 'NVDA NOV21 170P', 'Sell to open', '−2', '+820.00'],
  ['2026-10-14', 'AAPL NOV21 245C', 'Sell to open', '−1', '+235.00'],
  ['2026-10-13', 'MSFT DEC19 480P', 'Buy to close', '+1', '−310.00'],
  ['2026-10-10', 'TSLA NOV21 380P', 'Sell to open', '−1', '+915.00'],
  ['2026-10-09', 'AMD NOV21 150P', 'Sell to open', '−3', '+915.00'],
]

/** The page's table: the detail explains its picked row. */
function Ledger() {
  return (
    <div className="min-w-0 flex-1">
      <div className="pb-2 text-base font-semibold">Ledger</div>
      {ROWS.map(([d, c, s, q, cash], i) => (
        <div
          key={c}
          className={
            'flex items-center gap-4 rounded-md px-2 py-1.5 font-mono text-dense-body tabular-nums' +
            (i === 0 ? ' bg-accent/20' : '')
          }
        >
          <span className="w-24 text-muted-foreground">{d}</span>
          <span className="flex-1">{c}</span>
          <span className="w-28 font-sans">{s}</span>
          <span className="w-10 text-right">{q}</span>
          <span className="w-20 text-right">{cash}</span>
        </div>
      ))}
    </div>
  )
}

function Explain() {
  return (
    <div className="flex flex-col gap-2 p-4 text-dense-body">
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold">NVDA NOV21 170P</span>
        <DenseTag variant="success">open</DenseTag>
      </div>
      <p className="m-0 text-muted-foreground">
        Sold 2 at 4.10 on 14 Oct; the trade is #155. Cash in +820.00 less 1.30 commission.
      </p>
      <div className="flex justify-between font-mono tabular-nums">
        <span className="text-muted-foreground">Mark</span>
        <span>1.85</span>
      </div>
      <div className="flex justify-between font-mono tabular-nums">
        <span className="text-muted-foreground">Unrealized</span>
        <span>+450.00</span>
      </div>
    </div>
  )
}

/** Docked — wide, with 1200 of content area: a resident column beside the
    table, in the flow, no shadow. The provider measures `main` (the content
    area, never the scroller inside it) for the verdict. */
export const Docked = () => (
  <LayoutProvider override={{ w: 'wide', h: 'tall', input: 'pointer' }}>
    <main className="relative flex h-svh items-start gap-3 bg-background p-6 text-foreground">
      <Ledger />
      <DetailPane open onClose={() => {}} title="NVDA NOV21 170P" label="Fill detail">
        <Explain />
      </DetailPane>
    </main>
  </LayoutProvider>
)

/** Not docked (no provider here; under one, any class above compact without
    the room): an opaque overlay on the right of its parent, `--background` +
    `--glass-drop`. The parent is `position: relative` and the pane is the
    scroller's sibling, so it does not scroll away with the table. On compact
    the same children open in a BottomSheet (see its card); crossing a class
    moves the node they live in, so the selection, open sections and scroll
    stay. */
export const Overlay = () => (
  <div className="relative flex h-svh items-start gap-3 bg-background p-6 text-foreground">
    <Ledger />
    <DetailPane open onClose={() => {}} title="NVDA NOV21 170P" label="Fill detail">
      <Explain />
    </DetailPane>
  </div>
)
