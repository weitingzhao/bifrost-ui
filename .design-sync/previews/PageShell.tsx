import { PageHeader, PageShell, SegmentControl } from '@bifrost/ui'
import { useState } from 'react'

/** The page frame every route mounts into: card ground, card ink, `p-4`, and
    a minimum height that fills the viewport so a short page still owns its
    background. It is a container — it sets ground and padding, nothing else. */
export const DefaultPadding = () => {
  const [v, setV] = useState('positions')
  return (
    <PageShell>
      <PageHeader
        title="Positions"
        description="Open legs across every linked account, priced off the current session."
        actions={
          <SegmentControl
            value={v}
            onChange={setV}
            options={[
              { value: 'positions', label: 'Positions' },
              { value: 'backing', label: 'Backing' },
            ]}
            ariaLabel="Switch view"
          />
        }
      />
      <div className="mt-4 rounded-lg border border-border bg-background p-3 text-dense-body text-muted-foreground">
        Page content sits here, on the shell's card ground.
      </div>
    </PageShell>
  )
}

/** `padding="compact"` — `px-3 py-2`, for a route that is itself a dense table
    and wants its own chrome to be as thin as the rows. */
export const CompactPadding = () => (
  <PageShell padding="compact">
    <PageHeader title="Trade Ledger" />
    <div className="mt-2 rounded-lg border border-border bg-background p-2 text-dense-body text-muted-foreground">
      px-3 py-2 — the frame gives back the space the table wants.
    </div>
  </PageShell>
)

/** `padding="none"` — for a route that draws edge to edge (a full-bleed chart
    or a split pane that manages its own gutters). */
export const NoPadding = () => (
  <PageShell padding="none">
    <div className="border-b border-border px-3 py-2 text-dense-body font-semibold">
      Payoff surface
    </div>
    <div className="p-3 text-dense-body text-muted-foreground">
      The shell contributes ground and height, and no padding at all.
    </div>
  </PageShell>
)
