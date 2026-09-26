import { DenseTag, PageHead, PageHeadAction } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** One row: title · ⓘ · stamp · meta · actions, ending in one hairline (43px).
    The description lives behind ⓘ — never on screen by default. `stamp` is
    the freshness slot and never shrinks; `meta` is mono counts. */
export const Head = () => (
  <Surface>
    <PageHead
      title="Positions"
      info="Every open leg across the three accounts, grouped by underlying, on the latest broker snapshot."
      stamp={<DenseTag variant="neutral">as of 16:00 ET</DenseTag>}
      meta="41 legs · 23 names"
      actions={
        <>
          <PageHeadAction title="Download the table as CSV">Export</PageHeadAction>
          <PageHeadAction primary>Refresh</PageHeadAction>
        </>
      }
    />
  </Surface>
)

/** With `tabs`, a second row of underlined tabs (75px). A tab can carry a
    mono count; `countClassName` colours it when the count is a reading. */
export const WithTabs = () => {
  const [tab, setTab] = useState('open')
  return (
    <Surface>
      <PageHead
        title="Orders"
        info="Working and recent orders at the broker, newest first."
        stamp={<DenseTag variant="neutral">live</DenseTag>}
        tabs={[
          { value: 'open', label: 'Working', count: 3 },
          { value: 'filled', label: 'Filled today', count: 12 },
          { value: 'rejected', label: 'Rejected', count: 1, countClassName: 'text-loss' },
        ]}
        tab={tab}
        onTab={setTab}
        actions={<PageHeadAction>New order</PageHeadAction>}
      />
    </Surface>
  )
}

/** A stale stamp stays visible — the slot never shrinks, so the reader
    always sees how old the page is. An action can carry a state colour. */
export const StaleStamp = () => (
  <Surface>
    <PageHead
      title="Backing"
      info="Option obligations against the cash and fixed-income ETFs that back them, per account."
      stamp={<DenseTag variant="warning">last read 09:36 ET · 5 min ago</DenseTag>}
      meta="3 accounts"
      actions={
        <PageHeadAction ink="var(--color-lamp-yellow)" title="The last refresh failed">
          Retry
        </PageHeadAction>
      }
    />
  </Surface>
)
