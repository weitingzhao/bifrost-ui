import { BifrostLogoFull } from '@bifrost/ui'

/** The sidebar ground, not the page ground — this lockup is tuned for
    `--sidebar` and its `--sidebar-primary` accent. */
function SidebarSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-64 rounded-lg border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground">
      {children}
    </div>
  )
}

/** The default lockup: mark, wordmark, and the product subtitle underneath.
    This is what the expanded sidebar header shows. */
export const Default = () => (
  <SidebarSurface>
    <BifrostLogoFull />
  </SidebarSurface>
)

/** `badge` marks which console this is; `productSubtitle` names the payload.
    Ops and Trade share the mark and differ only here. */
export const OpsConsole = () => (
  <SidebarSurface>
    <BifrostLogoFull productSubtitle="Ops" badge="Ops" />
  </SidebarSurface>
)

/** `contextLabel` is the live one — the current Task Mode or view. It truncates
    rather than wraps, because the sidebar width is fixed. */
export const WithContextLabel = () => (
  <div className="flex flex-col gap-3">
    <SidebarSurface>
      <BifrostLogoFull productSubtitle="Ops" badge="Ops" contextLabel="Satellite Build" />
    </SidebarSurface>
    <SidebarSurface>
      <BifrostLogoFull
        productSubtitle="Ops"
        badge="Ops"
        contextLabel="Market Data Subscription Focus"
      />
    </SidebarSurface>
  </div>
)

/** `productSubtitle=""` drops the second line entirely — for a header bar
    where vertical space is one row and the subtitle would not fit. */
export const NoSubtitle = () => (
  <SidebarSurface>
    <BifrostLogoFull productSubtitle="" />
  </SidebarSurface>
)
