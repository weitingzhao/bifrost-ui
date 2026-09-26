import { KpiCard, KpiStrip } from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** A row of `stat` readings (16px) on its own group. Readings wrap before
    they shrink; each keeps its label above it. */
export const Stats = () => (
  <Surface>
    <KpiStrip>
      <KpiCard label="Open positions" value="23" />
      <KpiCard label="Day P&L" value="+4,210" valueClassName="text-profit" />
      <KpiCard label="Unrealized" value="−1,870" valueClassName="text-unrealized" />
      <KpiCard label="Delta" value="−182" sub="β-weighted to SPY" />
      <KpiCard label="Theta / day" value="+318" />
    </KpiStrip>
  </Surface>
)

/** `variant="panel"` readings are 20px — for a strip that heads a panel. */
export const PanelReadings = () => (
  <Surface>
    <KpiStrip>
      <KpiCard variant="panel" label="Buying power" value="$412,000" />
      <KpiCard variant="panel" label="Excess liquidity" value="$286,500" />
      <KpiCard variant="panel" label="Maintenance margin" value="$98,200" />
    </KpiStrip>
  </Surface>
)

/** `inset` — already inside a group, so the strip draws no card of its own. */
export const Inset = () => (
  <Surface>
    <div className="panel-elevated">
      <div className="px-3.5 pt-3 text-dense-body font-semibold">NVDA · covered call</div>
      <KpiStrip inset>
        <KpiCard label="Shares" value="300" />
        <KpiCard label="Short calls" value="−3" />
        <KpiCard label="Premium kept" value="+2,526" valueClassName="text-profit" />
        <KpiCard label="Days to expiry" value="27" />
      </KpiStrip>
    </div>
  </Surface>
)

/** `state` on a strip colours its edge — the whole row is past a limit. */
export const WithState = () => (
  <Surface>
    <KpiStrip state="warn">
      <KpiCard label="Gross exposure" value="2.4×" sub="Limit 2.0×" />
      <KpiCard label="Largest name" value="31%" sub="NVDA" />
      <KpiCard label="Short puts" value="14" />
    </KpiStrip>
  </Surface>
)
