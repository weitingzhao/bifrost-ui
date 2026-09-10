import {
  CollapsibleChevron,
  CollapsibleGroup,
  CollapsibleGroupBody,
  CollapsibleGroupHeader,
  CollapsibleGroupStats,
  CollapsibleGroupTitle,
  DenseTag,
} from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

function Leg({ side, contract, qty }: { side: string; contract: string; qty: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 text-dense-body">
      <span className="w-10 text-muted-foreground">{side}</span>
      <span className="font-mono tabular-nums">{contract}</span>
      <span className="ml-auto font-mono tabular-nums text-muted-foreground">{qty}</span>
    </div>
  )
}

/** The whole family in its `card` variant: shell, header button, title, stats
    pushed right, body. The chevron is part of the header's children, not the
    shell — the caller decides where it sits. */
export const CardGroup = () => {
  const [open, setOpen] = useState(true)
  return (
    <Surface>
      <CollapsibleGroup>
        <CollapsibleGroupHeader expanded={open} onToggle={() => setOpen(o => !o)}>
          <CollapsibleChevron expanded={open} />
          <CollapsibleGroupTitle>NVDA — Covered Call</CollapsibleGroupTitle>
          <DenseTag variant="success">open</DenseTag>
          <CollapsibleGroupStats>
            <span>4 legs</span>
            <span>Δ +0.31</span>
            <span>21 DTE</span>
          </CollapsibleGroupStats>
        </CollapsibleGroupHeader>
        {open && (
          <CollapsibleGroupBody>
            <Leg side="LONG" contract="NVDA 250 shares" qty="+250" />
            <Leg side="SHORT" contract="NVDA 2026-11-21 190 C" qty="−2" />
            <Leg side="SHORT" contract="NVDA 2026-11-21 195 C" qty="−1" />
          </CollapsibleGroupBody>
        )}
      </CollapsibleGroup>
    </Surface>
  )
}

/** Folded — the header alone is the whole row. The stats stay readable when
    the body is closed; that is the point of putting them in the header. */
export const Folded = () => (
  <Surface>
    <CollapsibleGroup>
      <CollapsibleGroupHeader expanded={false} onToggle={() => {}}>
        <CollapsibleChevron expanded={false} />
        <CollapsibleGroupTitle>TLT — Cash Secured Put</CollapsibleGroupTitle>
        <CollapsibleGroupStats>
          <span>2 legs</span>
          <span>Δ −0.18</span>
          <span>45 DTE</span>
        </CollapsibleGroupStats>
      </CollapsibleGroupHeader>
    </CollapsibleGroup>
  </Surface>
)

/** `variant="inset"` — a top border instead of a card, for stacking groups
    inside a panel that already has its own frame. */
export const InsetVariant = () => (
  <Surface>
    <div className="rounded-lg border border-border bg-card px-2 pb-2">
      <div className="px-1 py-2 text-dense-body font-semibold">Backing by account</div>
      {['U1234567 — Margin', 'U7654321 — IRA'].map((label, i) => (
        <CollapsibleGroup key={label} variant="inset">
          <CollapsibleGroupHeader expanded={i === 0} onToggle={() => {}}>
            <CollapsibleChevron expanded={i === 0} />
            <CollapsibleGroupTitle>{label}</CollapsibleGroupTitle>
            <CollapsibleGroupStats>
              <span>{i === 0 ? '$412,880 BP' : '$88,120 BP'}</span>
            </CollapsibleGroupStats>
          </CollapsibleGroupHeader>
          {i === 0 && (
            <CollapsibleGroupBody>
              <Leg side="ETF" contract="SGOV" qty="1,400" />
              <Leg side="ETF" contract="TLT" qty="600" />
            </CollapsibleGroupBody>
          )}
        </CollapsibleGroup>
      ))}
    </div>
  </Surface>
)

/** `wrap` on the title — a long name breaks onto a second line instead of
    truncating. Use it when the tail of the name is what tells rows apart. */
export const WrappingTitle = () => (
  <Surface>
    <div className="w-80">
      <CollapsibleGroup>
        <CollapsibleGroupHeader expanded={false} onToggle={() => {}}>
          <CollapsibleChevron expanded={false} />
          <CollapsibleGroupTitle wrap>
            SMCI — Diagonal Call Spread rolled from 2026-10-17 into 2026-11-21
          </CollapsibleGroupTitle>
        </CollapsibleGroupHeader>
      </CollapsibleGroup>
    </div>
  </Surface>
)
