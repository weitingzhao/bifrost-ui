import { SegmentControl } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** The canonical use: two or three mutually exclusive views of the same data.
    The label says what changes, not what the control is. */
export const TwoWaySwitch = () => {
  const [v, setV] = useState('snapshot')
  return (
    <Surface>
      <div className="flex items-center gap-3">
        <span className="text-dense-body text-muted-foreground">Greeks source</span>
        <SegmentControl
          value={v}
          onChange={setV}
          options={[
            { value: 'snapshot', label: 'Snapshot', title: 'Greeks as the vendor published them' },
            { value: 'bs', label: 'BS', title: 'Black-Scholes, computed locally from the mid' },
          ]}
          ariaLabel="Switch IV and Greeks columns between vendor snapshot and local Black-Scholes"
        />
      </div>
    </Surface>
  )
}

/** The three sizes. `xs` fits inside a table toolbar, `sm` is the default,
    `md` is for a page-level control that stands on its own line. */
export const Sizes = () => {
  const [a, setA] = useState('1d')
  const [b, setB] = useState('1d')
  const [c, setC] = useState('1d')
  const opts = [
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' },
    { value: '1m', label: '1M' },
    { value: '1y', label: '1Y' },
  ]
  return (
    <Surface>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="w-8 text-dense-meta text-muted-foreground">xs</span>
          <SegmentControl size="xs" value={a} onChange={setA} options={opts} ariaLabel="Range" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-8 text-dense-meta text-muted-foreground">sm</span>
          <SegmentControl size="sm" value={b} onChange={setB} options={opts} ariaLabel="Range" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-8 text-dense-meta text-muted-foreground">md</span>
          <SegmentControl size="md" value={c} onChange={setC} options={opts} ariaLabel="Range" />
        </div>
      </div>
    </Surface>
  )
}

/** A disabled segment stays visible and keeps its position — an option that
    disappears when unavailable makes the control's shape unlearnable. */
export const WithDisabledOption = () => {
  const [v, setV] = useState('eod')
  return (
    <Surface>
      <div className="flex items-center gap-3">
        <span className="text-dense-body text-muted-foreground">Chain session</span>
        <SegmentControl
          value={v}
          onChange={setV}
          options={[
            { value: 'eod', label: 'EOD' },
            { value: 'intraday', label: 'Intraday' },
            { value: 'trades', label: 'Trades', disabled: true, title: 'Not covered by the current subscription' },
          ]}
          ariaLabel="Chain session"
        />
      </div>
    </Surface>
  )
}
