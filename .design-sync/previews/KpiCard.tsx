import { KpiCard } from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** `variant="hero"` — the one reading a page leads with: 30px mono on the
    group material. The label is sentence case; `sub` says what it counts. */
export const Hero = () => (
  <Surface>
    <div className="w-72">
      <KpiCard
        variant="hero"
        label="Net liquidation"
        value="$1,250,000"
        sub="3 accounts · as of 16:00 ET"
      />
    </div>
  </Surface>
)

/** A state is the box's edge, never the reading's ink: the number keeps its
    own colour, so a warning does not read as a loss. */
export const HeroWithState = () => (
  <Surface>
    <div className="grid grid-cols-2 gap-3">
      <KpiCard
        variant="hero"
        state="warn"
        label="Backing ratio"
        value="1.18×"
        sub="Below the 1.25× floor on 1 account"
      />
      <KpiCard
        variant="hero"
        state="danger"
        label="Day P&L"
        value="−8,400"
        valueClassName="text-loss"
        sub="Past the daily loss limit"
      />
    </div>
  </Surface>
)

/** A signed reading takes a direction colour through `valueClassName`. */
export const SignedReading = () => (
  <Surface>
    <div className="w-72">
      <KpiCard variant="hero" label="Realized this month" value="+12,300" valueClassName="text-profit" sub="41 closed legs" />
    </div>
  </Surface>
)
