import { DenseTagButton } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

const SECTORS = ['Semiconductors', 'Fixed Income', 'Energy', 'Financials']

/** The clickable twin of DenseTag — same shell, `cursor-pointer` and a hover
    fade. Use it for filter chips, never for status (status is not a control). */
export const FilterChips = () => {
  const [on, setOn] = useState<string[]>(['Semiconductors'])
  const toggle = (s: string) =>
    setOn(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]))
  return (
    <Surface>
      <div className="flex flex-col gap-2">
        <span className="text-dense-meta text-muted-foreground">Filter by sector</span>
        <div className="flex flex-wrap items-center gap-2">
          {SECTORS.map(s => (
            <DenseTagButton
              key={s}
              variant={on.includes(s) ? 'info' : 'category'}
              onClick={() => toggle(s)}
              aria-pressed={on.includes(s)}
            >
              {s}
            </DenseTagButton>
          ))}
        </div>
      </div>
    </Surface>
  )
}

/** Dismissible tokens — `size="pill"` with the count of what each removes. */
export const RemovableTokens = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-2">
      <DenseTagButton variant="info" size="pill" title="Remove this filter">
        DTE ≤ 45 ✕
      </DenseTagButton>
      <DenseTagButton variant="info" size="pill" title="Remove this filter">
        IV rank ≥ 40 ✕
      </DenseTagButton>
      <DenseTagButton variant="neutral" size="pill" title="Clear all filters">
        Clear all
      </DenseTagButton>
    </div>
  </Surface>
)
