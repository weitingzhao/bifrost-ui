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
