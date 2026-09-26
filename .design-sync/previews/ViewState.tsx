import { ViewState } from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** `failed` — the read failed and there is nothing to show. Red, and it says
    which thing and when, so the reader knows nothing below was evaluated. */
export const Failed = () => (
  <Surface>
    <ViewState
      kind="failed"
      title="Couldn’t load the limit book"
      detail="trade-api returned 503 at 09:41 ET · nothing below was evaluated"
      onAction={() => {}}
    />
  </Surface>
)

/** `stale` — a refresh failed but the last copy is still good. Always a strip
    laid over the data, never a replacement for it. */
export const Stale = () => (
  <Surface>
    <div className="panel-elevated flex flex-col gap-2 p-3">
      <ViewState kind="stale" detail="Last good read 09:36 ET · 5 min ago" onAction={() => {}} />
      <div className="flex justify-between font-mono text-dense-body tabular-nums">
        <span>NVDA</span>
        <span>300</span>
      </div>
      <div className="flex justify-between font-mono text-dense-body tabular-nums">
        <span>AMD</span>
        <span>200</span>
      </div>
    </div>
  </Surface>
)

/** `empty` and `filtered` are both grey and both "no rows", but only
    `filtered` offers to clear the filters — the list is empty because of them. */
export const EmptyAndFiltered = () => (
  <Surface>
    <div className="grid grid-cols-2 gap-3">
      <div className="panel-elevated">
        <ViewState kind="empty" title="No open orders" detail="Nothing is working at the broker right now." />
      </div>
      <div className="panel-elevated">
        <ViewState kind="filtered" detail="Account: IRA · Side: Sell" onAction={() => {}} />
      </div>
    </div>
  </Surface>
)

/** `notwired` — designed but the feed is not connected. Grey, never red:
    a missing reading is not a fault. */
export const NotWired = () => (
  <Surface>
    <ViewState kind="notwired" title="IV rank history" detail="Needs the option_daily IV series for this symbol." />
  </Surface>
)

/** `loading` — a skeleton shaped like the table it stands in for, shown only
    after 300ms so a fast read never flashes. */
export const Loading = () => (
  <Surface>
    <ViewState kind="loading" rows={4} cols={5} />
  </Surface>
)
