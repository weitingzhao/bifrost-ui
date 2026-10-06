import { FilterChip, FilterTray } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** Pick several (§17.10): each chip is one on/off filter. On is ink 15% and
    ink; off is ink 4% and mute. The count is mono and mute. The accent never
    marks a filter — it stays for the page's one current thing. */
export const Layers = () => {
  const [on, setOn] = useState(new Set(['pnl', 'fills', 'events']))
  const flip = (id: string) => (next: boolean) => {
    const s = new Set(on)
    if (next) s.add(id)
    else s.delete(id)
    setOn(s)
  }
  const chips = [
    ['pnl', 'P&L', 7],
    ['fills', 'Fills', 25],
    ['expiry', 'Expiries', 3],
    ['corp', 'Corp actions', 2],
    ['events', 'Events', 8],
  ] as const
  return (
    <Surface>
      <div className="flex flex-wrap items-center gap-1">
        {chips.map(([id, label, n]) => (
          <FilterChip key={id} pressed={on.has(id)} onPressedChange={flip(id)} count={n} title={`From the page that owns ${label}`}>
            {label}
          </FilterChip>
        ))}
      </div>
    </Surface>
  )
}

/** A joined tray: a short on/off set flush in one capsule — accounts in scope,
    holding types. The page decides whether one must stay on. */
export const JoinedScope = () => {
  const [acct, setAcct] = useState({ host: true, secondary: false })
  const [types, setTypes] = useState({ opt: true, sh: true })
  return (
    <Surface>
      <div className="flex items-center gap-3 text-dense-body">
        <span className="text-dense-meta font-semibold text-muted-foreground">Scope</span>
        <FilterTray variant="joined" aria-label="Accounts in scope">
          <FilterChip pressed={acct.host} onPressedChange={(v) => setAcct({ ...acct, host: v })}>
            Host
          </FilterChip>
          <FilterChip pressed={acct.secondary} onPressedChange={(v) => setAcct({ ...acct, secondary: v })}>
            Secondary
          </FilterChip>
        </FilterTray>
        <FilterTray variant="joined" aria-label="Holding types in scope">
          <FilterChip
            pressed={types.opt}
            onPressedChange={(v) => (v || types.sh) && setTypes({ ...types, opt: v })}
          >
            Options
          </FilterChip>
          <FilterChip
            pressed={types.sh}
            onPressedChange={(v) => (v || types.opt) && setTypes({ ...types, sh: v })}
          >
            Shares
          </FilterChip>
        </FilterTray>
      </div>
    </Surface>
  )
}

/** A chip is a plain button: it takes `draggable` and the drag handlers, so a
    reorderable set (Market Live categories) keeps one look. */
export const Draggable = () => {
  const [order, setOrder] = useState(['Wheel', 'Income', 'Hedge', 'Core'])
  const [on, setOn] = useState(new Set(['Wheel', 'Income']))
  return (
    <Surface>
      <div className="flex items-center gap-1" role="group" aria-label="Category">
        {order.map((cat) => (
          <FilterChip
            key={cat}
            pressed={on.has(cat)}
            onPressedChange={(v) => {
              const s = new Set(on)
              if (v) s.add(cat)
              else s.delete(cat)
              setOn(s)
            }}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', cat)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const dragged = e.dataTransfer.getData('text/plain')
              const next = order.filter((c) => c !== dragged)
              next.splice(next.indexOf(cat), 0, dragged)
              setOrder(next)
            }}
          >
            <span aria-hidden className="text-muted-foreground">⋮⋮</span>
            {cat}
          </FilterChip>
        ))}
      </div>
    </Surface>
  )
}

/** A narrow rail (0.12.0, Rev .156 §17.10): `size="sm"` is 20 high, 11px.
    `dashed` marks a narrative condition — one the model does not compute — with
    an ink 30% dashed outline, on and off. `missing` is a condition with no value
    over the current range: ink 4% and faint, not clickable; the reason goes in
    `title`. */
export const MethodRail = () => {
  const [on, setOn] = useState(new Set(['ivr', 'trend', 'catalyst']))
  const flip = (id: string) => (next: boolean) => {
    const s = new Set(on)
    if (next) s.add(id)
    else s.delete(id)
    setOn(s)
  }
  return (
    <Surface>
      <div className="flex flex-col gap-2 text-dense-body">
        <span className="text-dense-meta font-semibold text-muted-foreground">Method · NVDA short put</span>
        <div className="flex flex-wrap items-center gap-1">
          <FilterChip size="sm" pressed={on.has('ivr')} onPressedChange={flip('ivr')} count={62}>
            IV rank ≥ 50
          </FilterChip>
          <FilterChip size="sm" pressed={on.has('trend')} onPressedChange={flip('trend')}>
            Above 50-day
          </FilterChip>
          <FilterChip size="sm" pressed={on.has('dte')} onPressedChange={flip('dte')} count="30–45">
            DTE
          </FilterChip>
          <FilterChip
            size="sm"
            dashed
            pressed={on.has('catalyst')}
            onPressedChange={flip('catalyst')}
            title="Narrative: not computed by the model"
          >
            No catalyst before expiry
          </FilterChip>
          <FilterChip size="sm" dashed pressed={on.has('sector')} onPressedChange={flip('sector')}>
            Sector leading
          </FilterChip>
          <FilterChip size="sm" missing pressed={false} title="No VRP reading over this range — the 20-day IV history starts 12 Sep">
            VRP &gt; 0
          </FilterChip>
        </div>
      </div>
    </Surface>
  )
}
