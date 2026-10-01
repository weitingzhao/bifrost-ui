import { Button, DenseTag, Input, InspectorField, InspectorPanel, NumberField } from '@bifrost/ui'
import { useState } from 'react'

/** The page the inspector floats over: the plan list it edits. The panel is
    glass, so it needs real content behind it to read as a material. */
function Plans({ children }: { children: React.ReactNode }) {
  const rows = [
    ['NVDA', 'Short put', 'NOV21 170P', 'draft'],
    ['AAPL', 'Covered call', 'NOV21 245C', 'draft'],
    ['MSFT', 'Put spread', 'DEC19 480/470P', 'draft'],
    ['AMZN', 'Short strangle', 'NOV21 200P/245C', 'filled'],
    ['META', 'Short put', 'DEC19 640P', 'draft'],
    ['TSLA', 'Iron condor', 'NOV21 380/400 · 520/540', 'intended'],
    ['GOOGL', 'Covered call', 'DEC19 270C', 'draft'],
    ['AVGO', 'Short put', 'NOV21 330P', 'expired'],
  ]
  return (
    <div className="relative h-84 w-full overflow-hidden rounded-lg bg-background text-foreground">
      <div className="flex flex-col gap-1 p-4 pr-88">
        {rows.map(([sym, structure, legs, state]) => (
          <div key={sym} className="flex items-center gap-3 py-1.5 text-dense-body">
            <span className="w-14 font-mono font-semibold">{sym}</span>
            <span className="w-28 text-muted-foreground">{structure}</span>
            <span className="flex-1 font-mono tabular-nums">{legs}</span>
            <DenseTag variant="neutral">{state}</DenseTag>
          </div>
        ))}
      </div>
      <div className="absolute right-2 top-2">{children}</div>
    </div>
  )
}

function Num({ initial }: { initial: string }) {
  const [v, setV] = useState(initial)
  return <NumberField value={v} onValueChange={setV} className="font-mono tabular-nums" />
}

/** One object selected: its fields, edited in place. Every field writes back as
    it changes — there is no Save button — and ⌘Z undoes. `meta` is the second
    line (status · id); `foot` says how saving works. */
export const Single = () => (
  <Plans>
    <InspectorPanel
      selection="single"
      title="NVDA · Short put"
      meta="draft · plan #214"
      foot="Edits save as you type · ⌘Z undoes"
      onClose={() => {}}
    >
      <InspectorField label="Contract">
        <Input defaultValue="NVDA 2026-11-21 170 P" className="font-mono" />
      </InspectorField>
      <div className="grid grid-cols-2 gap-3">
        <InspectorField label="Limit">
          <Num initial="4.85" />
        </InspectorField>
        <InspectorField label="Contracts">
          <Num initial="2" />
        </InspectorField>
      </div>
      <InspectorField label="Max loss" hint="Stops the plan when the mark reaches it">
        <Num initial="1,200" />
      </InspectorField>
    </InspectorPanel>
  </Plans>
)

/** Several selected: only batch fields, and `batchNote` says which part of the
    selection they apply to — an object that is already live is skipped. */
export const Multi = () => (
  <Plans>
    <InspectorPanel
      selection="multi"
      title="4 selected"
      batchNote="Applies to 3 drafts · 1 filled is skipped"
      foot="Edits save as you type · ⌘Z undoes"
      onClose={() => {}}
    >
      <InspectorField label="Expiry">
        <Input defaultValue="2026-11-21" className="font-mono" />
      </InspectorField>
      <InspectorField label="Contracts each">
        <Num initial="1" />
      </InspectorField>
    </InspectorPanel>
  </Plans>
)

/** A live object (intended, filled, expired) is read-only: `readOnly.reason`
    says why in one line and `exits` gives the ways out. Changing it is an
    action, not an edit. */
export const ReadOnly = () => (
  <Plans>
    <InspectorPanel
      selection="single"
      title="AMZN · Short strangle"
      meta="filled · plan #198"
      readOnly={{
        reason: 'Filled on 2026-09-14 — the legs are positions now.',
        exits: (
          <>
            <Button size="xs" variant="secondary">Duplicate</Button>
            <Button size="xs" variant="ghost">Open position</Button>
          </>
        ),
      }}
      onClose={() => {}}
    >
      <InspectorField label="Contracts">
        <Input defaultValue="AMZN 2026-11-21 200 P · 245 C" className="font-mono" disabled />
      </InspectorField>
    </InspectorPanel>
  </Plans>
)

/** Nothing selected: the `empty` line says how to get going. No foot. */
export const Empty = () => (
  <Plans>
    <InspectorPanel selection="none" empty="Select a plan to edit it here. ⇧-click selects several." />
  </Plans>
)
