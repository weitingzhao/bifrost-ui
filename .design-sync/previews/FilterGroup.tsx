import { FilterGroup, SegmentControl } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

const BOOK = [
  { id: 'pnl', label: 'P&L', count: 7, title: 'From Performance · days before today' },
  { id: 'fills', label: 'Fills', count: 25, title: 'From Orders & Fills · days before today' },
  { id: 'expiry', label: 'Expiries', count: 3, title: 'From Expiry · today on' },
  { id: 'corp', label: 'Corp actions', count: 2, title: 'From Corporate Actions · today on' },
  { id: 'events', label: 'Events', count: 8, title: 'From Events · today on' },
]
const LOOP = [
  { id: 'decisions', label: 'Decisions', count: 12, title: 'From Journal · days before today' },
  { id: 'notes', label: 'Notes', count: 0, title: 'From Journal · days before today' },
  { id: 'horizons', label: 'Horizons', count: 4, title: 'From Hypotheses · today on' },
  { id: 'drafts', label: 'Draft expiry', count: 16, title: 'From Decision Inbox · today on' },
]
const PRESETS: Record<string, string[]> = {
  trading: ['pnl', 'fills', 'events', 'expiry', 'corp'],
  research: ['decisions', 'horizons', 'drafts', 'events'],
  review: ['pnl', 'fills', 'decisions', 'notes'],
}

/** Grouped pick-several (§17.10): one tray per business group, its head a
    tri-state checkbox — all ✓, some –, none empty — and the group name dims
    with it. Clicking the head turns an all-on group off and anything else all
    on. The Calendar's layers, with its presets: a set that matches no preset
    reads Custom. */
export const CalendarLayers = () => {
  const [on, setOn] = useState(new Set(PRESETS.trading))
  const preset = Object.keys(PRESETS).find((k) => PRESETS[k].length === on.size && PRESETS[k].every((x) => on.has(x))) ?? 'custom'
  return (
    <Surface>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-dense-meta font-semibold text-muted-foreground">Preset</span>
          <SegmentControl
            size="xs"
            ariaLabel="Preset"
            value={preset}
            onChange={(v) => v !== 'custom' && setOn(new Set(PRESETS[v]))}
            options={[
              { value: 'trading', label: 'Trading' },
              { value: 'research', label: 'Research' },
              { value: 'review', label: 'Review' },
              ...(preset === 'custom' ? [{ value: 'custom', label: 'Custom' }] : []),
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterGroup label="Book & market" items={BOOK} value={on} onChange={setOn} />
          <FilterGroup label="Research loop" items={LOOP} value={on} onChange={setOn} />
        </div>
      </div>
    </Surface>
  )
}

/** The three head states side by side: all, some, none. */
export const HeadStates = () => (
  <Surface>
    <div className="flex flex-col items-start gap-2">
      <FilterGroup label="Book & market" items={BOOK} value={BOOK.map((b) => b.id)} onChange={() => {}} />
      <FilterGroup label="Book & market" items={BOOK} value={['fills', 'events']} onChange={() => {}} />
      <FilterGroup label="Book & market" items={BOOK} value={[]} onChange={() => {}} />
    </div>
  </Surface>
)
