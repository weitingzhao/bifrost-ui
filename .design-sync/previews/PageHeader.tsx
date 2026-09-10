import { DenseTag, PageHeader, SegmentControl } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** Title plus one sentence of description. The description says what the page
    is showing right now, not what the feature is for. */
export const TitleAndDescription = () => (
  <Surface>
    <PageHeader
      title="Option Discovery"
      description="Chain, strike ladder and IV term structure for one underlying, on the current session's snapshot."
    />
  </Surface>
)

/** `actions` sit on the same line and wrap before they overflow; the title
    block keeps `min-w-0` so a long title truncates instead of pushing them off. */
export const WithActions = () => {
  const [v, setV] = useState('eod')
  return (
    <Surface>
      <PageHeader
        title="Market Data Coverage"
        description="575 symbols in the option universe · 566 with an EOD chain for this session."
        actions={
          <>
            <SegmentControl
              value={v}
              onChange={setV}
              options={[
                { value: 'eod', label: 'EOD' },
                { value: 'intraday', label: 'Intraday' },
              ]}
              ariaLabel="Session"
            />
            <button
              type="button"
              className="rounded-md border border-border bg-secondary px-2.5 py-1 text-dense-meta font-medium hover:bg-muted"
            >
              Run Doctor
            </button>
          </>
        }
      />
    </Surface>
  )
}

/** `breadcrumb` renders above the title, and `titleSize="large"` is for a
    section landing page rather than a leaf route. */
export const WithBreadcrumbAndLargeTitle = () => (
  <Surface>
    <PageHeader
      titleSize="large"
      breadcrumb={
        <nav className="flex items-center gap-1.5 text-dense-meta text-muted-foreground">
          <span>Research</span>
          <span aria-hidden>/</span>
          <span>Analyze</span>
          <span aria-hidden>/</span>
          <span className="text-foreground">Dossier</span>
        </nav>
      }
      title={
        <span className="flex items-center gap-2">
          NVDA
          <DenseTag variant="info" size="pill">IV rank 62</DenseTag>
        </span>
      }
      description="Every lens that has an opinion on this symbol, with the evidence each one read."
    />
  </Surface>
)
