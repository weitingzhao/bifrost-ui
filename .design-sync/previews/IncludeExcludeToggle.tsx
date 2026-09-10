import { IncludeExcludeToggle } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** `layout="inline"` (default) — label left, control right, for a filter row
    where every line is one criterion. */
export const Inline = () => {
  const [earnings, setEarnings] = useState(false)
  const [weeklies, setWeeklies] = useState(true)
  const [otc, setOtc] = useState(false)
  return (
    <Surface>
      <div className="flex w-72 flex-col gap-2">
        <IncludeExcludeToggle label="Earnings within DTE" include={earnings} onChange={setEarnings} />
        <IncludeExcludeToggle label="Weekly expiries" include={weeklies} onChange={setWeeklies} />
        <IncludeExcludeToggle label="OTC symbols" include={otc} onChange={setOtc} />
      </div>
    </Surface>
  )
}

/** `layout="stacked"` — label above a full-width control, for a narrow filter
    rail where the inline label would truncate. */
export const Stacked = () => {
  const [v, setV] = useState(true)
  return (
    <Surface>
      <div className="w-44">
        <IncludeExcludeToggle
          layout="stacked"
          label="Assignment risk this cycle"
          include={v}
          onChange={setV}
        />
      </div>
    </Surface>
  )
}
