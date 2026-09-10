import { CollapsibleBucketHeader } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** A section divider that folds — no card, no border, just a bold label with
    the chevron and an optional count. Use it to bucket rows inside a panel
    that already has a frame. */
export const Buckets = () => {
  const [open, setOpen] = useState<Record<string, boolean>>({ Assigned: true })
  const toggle = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }))
  return (
    <Surface>
      <div className="flex flex-col">
        <CollapsibleBucketHeader
          expanded={!!open.Assigned}
          onToggle={() => toggle('Assigned')}
          label="Assigned this cycle"
          count={3}
        />
        {open.Assigned && (
          <div className="pl-5 text-dense-body text-muted-foreground">
            <div>NVDA 2026-11-21 190 C — 2 contracts</div>
            <div>TLT 2026-11-21 88 P — 1 contract</div>
            <div>SMCI 2026-11-21 42 C — 1 contract</div>
          </div>
        )}
        <CollapsibleBucketHeader
          expanded={!!open.Expiring}
          onToggle={() => toggle('Expiring')}
          label="Expiring worthless"
          count={11}
        />
        <CollapsibleBucketHeader
          expanded={!!open.Rolled}
          onToggle={() => toggle('Rolled')}
          label="Rolled forward"
        />
      </div>
    </Surface>
  )
}
