import { SegmentControl, TimeStrip, stripDates } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

const TODAY = '2026-09-11'
const INK = { macro: 'var(--sk-ink, var(--foreground))', contract: 'var(--sk-contract)', sym: 'var(--sk-ticker)' }

function Mark({ t, c }: { t: string; c: string }) {
  return (
    <span className="truncate font-mono" style={{ fontSize: 9, lineHeight: '12px', color: c, maxWidth: '100%' }}>
      {t}
    </span>
  )
}

// Events: 30 days, four lanes; weekends only where something is dated.
const EVENTS: Record<string, Record<string, string>> = {
  macro: { '2026-09-15': 'CPI', '2026-09-17': 'FOMC', '2026-10-02': 'NFP' },
  opex: { '2026-09-18': 'OPEX', '2026-09-25': 'wk', '2026-10-02': 'wk', '2026-10-09': 'wk' },
  book: { '2026-09-23': 'TSLA', '2026-10-08': 'NVDA' },
  watch: { '2026-09-17': 'AVGO', '2026-09-24': 'CRWD', '2026-10-06': 'APP' },
}
const LANES = [
  { id: 'macro', label: 'Macro' },
  { id: 'opex', label: 'OPEX', ink: 'var(--sk-contract)' },
  { id: 'book', label: 'Book', ink: 'var(--sk-ticker)' },
  { id: 'watch', label: 'Watchlist' },
]
const LANE_INK: Record<string, string> = { macro: INK.macro, opex: INK.contract, book: INK.sym, watch: 'var(--sk-mute2, var(--muted-foreground))' }

/** Lanes (Events, the next 30 days): today is the accent line, Mondays a faint
    rule; the page draws each day's event. */
export const Lanes = () => (
  <Surface>
    <TimeStrip
      aria-label="Next 30 days"
      dates={stripDates(TODAY, '2026-10-10')}
      today={TODAY}
      lanes={LANES}
      renderLane={(lane, d) => {
        const t = EVENTS[lane]?.[d]
        return t ? (
          <span className="inline-flex items-center gap-1">
            <span className="rounded-full" style={{ width: 7, height: 7, background: LANE_INK[lane] }} />
            <span className="font-mono" style={{ fontSize: 9, color: LANE_INK[lane] }}>{t}</span>
          </span>
        ) : null
      }}
    />
  </Surface>
)

// Expiry ladder: the next ten Fridays.
const FRIDAYS = ['2026-09-18', '2026-09-25', '2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23', '2026-10-30', '2026-11-06', '2026-11-13', '2026-11-20']
const LADDER: Record<string, { n: number; delta: number; notional: number; marks: [string, string][] }> = {
  '2026-09-18': { n: 3, delta: 78, notional: 11800, marks: [['FOMC Thu', INK.macro], ['OPEX', INK.contract]] },
  '2026-09-25': { n: 2, delta: 55, notional: 25000, marks: [['TSLA ER Wed', INK.sym]] },
  '2026-10-09': { n: 0, delta: 0, notional: 0, marks: [['NVDA ER Thu', INK.sym]] },
  '2026-10-16': { n: 6, delta: 174, notional: 109000, marks: [['OPEX', INK.contract]] },
  '2026-10-30': { n: 0, delta: 0, notional: 0, marks: [['FOMC Wed', INK.macro]] },
  '2026-11-20': { n: 1, delta: 22, notional: 8800, marks: [['OPEX', INK.contract]] },
}

/** Bars (Expiry ladder): one column per Friday, the bar the exposure expiring
    there; the selected column solid, the rest 45%. ← → move once focused. */
export const Ladder = () => {
  const [sel, setSel] = useState<string | null>('2026-09-18')
  const [k, setK] = useState<'n' | 'delta' | 'notional'>('n')
  const v = (d: string) => LADDER[d]?.[k] ?? 0
  const fmt = (x: number) => (k === 'n' ? String(x) : k === 'delta' ? `+${x} Δ` : `$${(x / 1000).toFixed(1)}k`)
  return (
    <Surface>
      <div className="flex flex-col gap-2">
        <SegmentControl
          size="xs"
          ariaLabel="Bar height"
          value={k}
          onChange={(x) => setK(x as typeof k)}
          options={[
            { value: 'n', label: 'Contracts' },
            { value: 'delta', label: 'Delta' },
            { value: 'notional', label: 'Notional' },
          ]}
        />
        <TimeStrip
          aria-label="Expiry ladder"
          dates={FRIDAYS}
          today={TODAY}
          barValue={v}
          renderValue={(d) => (v(d) ? fmt(v(d)) : '—')}
          renderMarks={(d) => (LADDER[d]?.marks ?? []).map(([t, c]) => <Mark key={t} t={t} c={c} />)}
          renderSub={(d) => `${Math.round((Date.parse(d) - Date.parse(TODAY)) / 864e5)}d`}
          selected={sel}
          onSelect={setSel}
        />
      </div>
    </Surface>
  )
}

const CA: Record<string, [string, string][]> = {
  '2026-09-25': [['PFF', 'DIV']],
  '2026-09-30': [['SGOV', 'DIV']],
  '2026-10-02': [['NVDA', 'DIV']],
  '2026-10-08': [['RKLB', 'SPLIT']],
  '2026-10-14': [['DDOG', 'SPIN']],
}

/** Marks (Corporate Actions): today to the last action, a symbol and the
    action's short name under each date. */
export const Marks = () => (
  <Surface>
    <TimeStrip
      aria-label="Corporate actions by date"
      dates={stripDates(TODAY, '2026-10-14')}
      today={TODAY}
      renderMarks={(d) =>
        (CA[d] ?? []).map(([sym, kind]) => (
          <span key={sym} className="flex flex-col items-center" style={{ lineHeight: '11px', marginTop: 2 }}>
            <span className="font-mono font-bold" style={{ fontSize: 9, color: 'var(--sk-ticker)' }}>{sym}</span>
            <span style={{ fontSize: 8, color: 'var(--sk-mute2, var(--muted-foreground))' }}>{kind}</span>
          </span>
        ))
      }
    />
  </Surface>
)
