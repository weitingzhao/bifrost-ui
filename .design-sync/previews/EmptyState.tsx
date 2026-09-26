import { Button, DenseTag, EmptyState } from '@bifrost/ui'
import { CircleSlash, Crosshair, SearchX, TriangleAlert } from 'lucide-react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** Nothing matched — say what was searched and what would widen it. An empty
    result is a fact about the query, not an error. */
export const NoResults = () => (
  <Surface>
    <EmptyState
      icon={<SearchX />}
      title="No contracts match this screen"
      description="575 symbols scanned · 0 with IV rank ≥ 40 and DTE between 21 and 45. Widen the DTE band or drop the IV floor."
    />
  </Surface>
)

/** Nothing chosen yet — the state before the first input, with the control
    that ends it. Never confuse this with "nothing found". */
export const NothingSelected = () => (
  <Surface>
    <EmptyState
      icon={<Crosshair />}
      title="Pick a symbol to analyse"
      description="Greeks, IV term structure and the payoff surface all key off one underlying."
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="secondary" size="sm">
            Open Scan
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Use last symbol
          </Button>
        </div>
      }
    />
  </Surface>
)

/** The fetch failed. Not knowing is its own state — it must not be dressed up
    as an empty result, and it must say what to do next. */
export const LoadFailed = () => (
  <Surface>
    <EmptyState
      icon={<TriangleAlert />}
      title="Could not reach the option chain service"
      description="research-api returned 503 at 09:41:02 ET. The last good snapshot is from the previous session."
      action={
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm">
            Retry
          </Button>
          <DenseTag variant="danger">503</DenseTag>
        </div>
      }
    />
  </Surface>
)

/** Inside a group, at the size it actually ships — the block is `py-8`, which
    is deliberately shorter than a half-empty page. */
export const InsideACard = () => (
  <Surface>
    <div className="panel-elevated">
      <div className="border-b px-3 py-2 text-dense-body font-semibold" style={{ borderColor: 'var(--table-rule)' }}>
        Open orders
      </div>
      <EmptyState icon={<CircleSlash />} title="No working orders" />
    </div>
  </Surface>
)
