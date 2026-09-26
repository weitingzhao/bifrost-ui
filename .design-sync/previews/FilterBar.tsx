import { FilterBar, Input, SegmentControl, ToolbarClear } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** The filters sit in one bar directly under the page head: frameless,
    radius 12, a solid raised base. `Label` names an axis, `Sep` divides axes,
    `Meta` is pushed right and says what the filters leave. */
export const PageFilters = () => {
  const [kind, setKind] = useState('all')
  const [dte, setDte] = useState('30')
  const [q, setQ] = useState('')
  const on = [kind !== 'all' && 'Kind', dte !== '30' && 'DTE', q !== '' && 'Search'].filter(Boolean) as string[]
  return (
    <Surface>
      <FilterBar aria-label="Position filters">
        <FilterBar.Label>Kind</FilterBar.Label>
        <SegmentControl
          value={kind}
          onChange={setKind}
          options={[
            { value: 'all', label: 'All' },
            { value: 'stock', label: 'Stock' },
            { value: 'option', label: 'Option' },
          ]}
          ariaLabel="Kind"
        />
        <FilterBar.Sep />
        <FilterBar.Label>DTE</FilterBar.Label>
        <SegmentControl
          value={dte}
          onChange={setDte}
          options={[
            { value: '7', label: '≤7' },
            { value: '30', label: '≤30' },
            { value: '90', label: '≤90' },
          ]}
          ariaLabel="Days to expiry"
        />
        <FilterBar.Sep />
        <Input className="h-7 w-44" placeholder="Symbol" value={q} onChange={e => setQ(e.target.value)} />
        <ToolbarClear
          resets={on}
          onClear={() => {
            setKind('all')
            setDte('30')
            setQ('')
          }}
        />
        <FilterBar.Meta>23 of 41 positions</FilterBar.Meta>
      </FilterBar>
    </Surface>
  )
}

/** With a filter on, `ToolbarClear` appears and counts every axis it resets. */
export const WithFiltersOn = () => (
  <Surface>
    <FilterBar aria-label="Ledger filters">
      <FilterBar.Label>Account</FilterBar.Label>
      <SegmentControl
        value="margin"
        onChange={() => {}}
        options={[
          { value: 'all', label: 'All' },
          { value: 'margin', label: 'Margin' },
          { value: 'ira', label: 'IRA' },
        ]}
        ariaLabel="Account"
      />
      <FilterBar.Sep />
      <FilterBar.Label>Side</FilterBar.Label>
      <SegmentControl
        value="sell"
        onChange={() => {}}
        options={[
          { value: 'all', label: 'All' },
          { value: 'buy', label: 'Buy' },
          { value: 'sell', label: 'Sell' },
        ]}
        ariaLabel="Side"
      />
      <ToolbarClear resets={['Account', 'Side']} onClear={() => {}} />
      <FilterBar.Meta>112 of 1,406 executions</FilterBar.Meta>
    </FilterBar>
  </Surface>
)
