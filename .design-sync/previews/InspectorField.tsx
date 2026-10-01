import { Input, InspectorField, NumberField } from '@bifrost/ui'
import { useState } from 'react'

/** A labelled field for `InspectorPanel`: label above, control below, an
    optional `hint` under it. It is a `<label>`, so clicking the label focuses
    the control. Shown here on its own; in an app it lives inside the panel. */
export const Fields = () => {
  const [limit, setLimit] = useState('4.85')
  return (
    <div className="rounded-lg bg-background p-4 text-foreground">
      <div className="panel-elevated flex w-72 flex-col gap-3 p-3">
        <InspectorField label="Contract">
          <Input defaultValue="NVDA 2026-11-21 170 P" className="font-mono" />
        </InspectorField>
        <InspectorField label="Limit" hint="Mid was 4.90 at 15:42 ET">
          <NumberField value={limit} onValueChange={setLimit} className="font-mono tabular-nums" />
        </InspectorField>
      </div>
    </div>
  )
}
