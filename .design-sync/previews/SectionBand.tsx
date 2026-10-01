import { Button, KpiCard, SectionBand } from '@bifrost/ui'

/** A band is the header row alone: its body is every sibling after it up to the
    next band, so a page adds one by placing a header, not by re-nesting the
    section. Every band folds (the whole row toggles; a button inside never
    does), open by default, and the fold is remembered per page (`persistKey`,
    the pathname by default). */
export const Sections = () => (
  <div className="flex w-full flex-col gap-3 rounded-lg bg-background p-4 text-foreground">
    <SectionBand id="exposure" persistKey="ds-preview" title="Exposure" meta="4 accounts" />
    <div className="grid grid-cols-3 gap-3">
      <KpiCard label="Net delta" value="+312" />
      <KpiCard label="Theta / day" value="+186" />
      <KpiCard label="Vega" value="−1,240" />
    </div>
    <SectionBand
      id="expiring"
      persistKey="ds-preview"
      title="Expiring this week"
      meta="Nov 21"
      actions={<Button size="xs" variant="ghost">Roll all</Button>}
    />
    <div className="panel-elevated p-3 text-dense-body text-muted-foreground">
      NVDA 170P · AAPL 245C · AMZN 200P — 5 contracts, all out of the money at 15:42 ET.
    </div>
    <SectionBand
      id="closed"
      persistKey="ds-preview"
      title="Closed this month"
      summary="11 trades · 82% won"
      summaryWhenFolded
      defaultOpen={false}
    />
    <div className="panel-elevated p-3 text-dense-body">AMZN strangle +412 · META put +265 · TSLA condor −180 — fold state is kept per page.</div>
  </div>
)
