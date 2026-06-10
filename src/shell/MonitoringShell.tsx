import { ShellSidebar } from './ShellSidebar'
import { PeerAppLinkCard } from './PeerAppLink'
import { ShellSidebarProvider, useShellSidebar } from './ShellSidebarContext'
import { ShellSidebarTrigger } from './ShellSidebarTrigger'
import type { MonitoringShellProps } from './types'

function MonitoringShellInner({
  productName,
  productTagline,
  productBadge,
  navGroups,
  peerApp,
  headerActions,
  sidebarFooter,
  children,
}: MonitoringShellProps) {
  const { state } = useShellSidebar()
  const footer = sidebarFooter ?? (peerApp != null ? <PeerAppLinkCard peer={peerApp} /> : null)

  return (
    <div className="shell-root" data-sidebar={state}>
      <ShellSidebar
        productName={productName}
        productTagline={productTagline}
        productBadge={productBadge}
        navGroups={navGroups}
        footer={footer}
      />
      <div className="shell-main">
        <header className="shell-header">
          <ShellSidebarTrigger />
          {headerActions != null && <div className="shell-header-actions">{headerActions}</div>}
        </header>
        <main className="shell-content">{children}</main>
      </div>
    </div>
  )
}

export function MonitoringShell(props: MonitoringShellProps) {
  return (
    <ShellSidebarProvider defaultOpen={props.sidebarDefaultOpen ?? true}>
      <MonitoringShellInner {...props} />
    </ShellSidebarProvider>
  )
}
