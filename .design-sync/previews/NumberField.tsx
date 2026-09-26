import { NumberField } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

function Field({ label, initial, step, autoFocus }: { label: string; initial: string; step?: string; autoFocus?: boolean }) {
  const [v, setV] = useState(initial)
  return (
    <label className="flex flex-col gap-1">
      <span className="text-dense-meta text-muted-foreground">{label}</span>
      <NumberField value={v} onValueChange={setV} step={step} autoFocus={autoFocus} className="font-mono tabular-nums" />
    </label>
  )
}

/** A field that holds a number steps. Focus it and the − ⋮ + capsule appears
    at its right edge: press to step, hold to repeat, drag the grip to scrub,
    ⇧ for ×10, ↑ ↓ too. The step is the value's own last decimal place. */
export const OrderTicket = () => (
  <Surface>
    <div className="grid w-80 grid-cols-2 gap-3">
      <Field label="Limit price" initial="8.40" autoFocus />
      <Field label="Contracts" initial="2" />
      <Field label="Max loss" initial="$1,500" step="100" />
      <Field label="Trail" initial="12.5%" />
    </div>
  </Surface>
)

/** Unfocused, it is an ordinary field — frameless, a 7% ink fill. A value
    that is not a number (a blank, "market") shows no stepper. */
export const AtRest = () => (
  <Surface>
    <div className="grid w-80 grid-cols-2 gap-3">
      <Field label="Strike" initial="190" />
      <Field label="Limit price" initial="market" />
    </div>
  </Surface>
)
