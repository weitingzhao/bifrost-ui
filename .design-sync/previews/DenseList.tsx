import { DenseList, DenseListHead, DenseListRow, DenseTag, denseTableNumCell } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

// The page gives the columns and the row's padding (a grid and px-2 py-1 on the
// head and every row); the list gives the material. Inline style, not an arbitrary-value class: a design's
// stylesheet is compiled, and `grid-cols-[…]` would not exist in it.
const COLS: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 72px 88px 64px',
  alignItems: 'center',
  columnGap: 12,
}

const SIGNALS = [
  { sym: 'NVDA', lens: 'IV rank', reading: '82', state: 'hot' as const },
  { sym: 'TLT', lens: 'VRP', reading: '+4.1', state: 'hot' as const },
  { sym: 'SMCI', lens: 'Slope', reading: '−0.018', state: 'cold' as const },
  { sym: 'AMD', lens: 'Pin', reading: '0.62', state: 'watch' as const },
  { sym: 'GOOG', lens: 'Terrain', reading: 'range', state: 'watch' as const },
]

const tagFor = { hot: 'success', cold: 'neutral', watch: 'warning' } as const

/** A list of div rows in the table-on-glass grammar: rows inset 6px, no rules,
    a 3% ink zebra, hover only on rows that open something, and the selected
    row an accent 18% capsule. Click a row to move the selection. */
export const Signals = () => {
  const [open, setOpen] = useState('TLT')
  return (
    <Surface>
      <DenseList aria-label="Signals">
        <DenseListHead className="px-2 pb-1" style={COLS}>
          <span>Symbol</span>
          <span>Lens</span>
          <span className="text-right">Reading</span>
          <span>State</span>
        </DenseListHead>
        {SIGNALS.map(s => (
          <DenseListRow key={s.sym} className="px-2 py-1" style={COLS} selected={s.sym === open} onClick={() => setOpen(s.sym)}>
            <span className="font-semibold" style={{ color: 'var(--sk-ticker)' }}>{s.sym}</span>
            <span className="text-muted-foreground">{s.lens}</span>
            <span className={denseTableNumCell}>{s.reading}</span>
            <span><DenseTag variant={tagFor[s.state]}>{s.state}</DenseTag></span>
          </DenseListRow>
        ))}
      </DenseList>
    </Surface>
  )
}

/** Rows that open nothing take no hover and no focus. `tint` paints the page's
    own row state — here a limit in breach — as the row's capsule. */
export const ReadOnlyWithTint = () => (
  <Surface>
    <DenseList aria-label="Account limits">
      <DenseListHead className="px-2 pb-1" style={COLS}>
        <span>Limit</span>
        <span className="text-right">Used</span>
        <span className="text-right">Cap</span>
        <span>State</span>
      </DenseListHead>
      <DenseListRow className="px-2 py-1" style={COLS}>
        <span>Buying power in use</span>
        <span className={denseTableNumCell}>41%</span>
        <span className={denseTableNumCell}>60%</span>
        <span><DenseTag variant="success">ok</DenseTag></span>
      </DenseListRow>
      <DenseListRow className="px-2 py-1" style={COLS} tint="color-mix(in srgb, var(--color-loss) 16%, transparent)">
        <span>Short puts per name</span>
        <span className={denseTableNumCell}>7</span>
        <span className={denseTableNumCell}>5</span>
        <span><DenseTag variant="danger">breach</DenseTag></span>
      </DenseListRow>
      <DenseListRow className="px-2 py-1" style={COLS}>
        <span>Days to nearest expiry</span>
        <span className={denseTableNumCell}>12</span>
        <span className={denseTableNumCell}>≥ 7</span>
        <span><DenseTag variant="success">ok</DenseTag></span>
      </DenseListRow>
    </DenseList>
  </Surface>
)
