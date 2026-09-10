import {
  ShellNavSidebar,
  SidebarProvider,
  TooltipProvider,
  type ShellNavGroup,
} from '@bifrost/ui'
import {
  Activity,
  BarChart3,
  Boxes,
  Database,
  LineChart,
  Radar,
  Settings,
  Wallet,
} from 'lucide-react'

/** `ShellNavSidebar` needs two providers above it, and both are real
    requirements of the component, not preview scaffolding:
      · `SidebarProvider` holds the open/collapsed state the `<Sidebar
        collapsible="icon">` inside it reads;
      · `TooltipProvider` — the collapsed icon rail labels every group with a
        Tooltip, so without it the collapsed state throws
        "`Tooltip` must be used within `TooltipProvider`" and renders nothing.
    Mount both once at the app root. */
function Shell({
  children,
  open = true,
}: {
  children: React.ReactNode
  open?: boolean
}) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={open}>
      <div className="flex h-[720px] w-full bg-background text-foreground">
        {children}
        <div className="flex-1 p-6">
          <div className="text-lg font-bold tracking-tight">Positions</div>
          <p className="mt-1 text-sm text-muted-foreground">
            The route the sidebar is currently pointing at.
          </p>
        </div>
      </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}

const TRADE_GROUPS: ShellNavGroup[] = [
  {
    label: 'Portfolio',
    icon: Wallet,
    defaultOpen: true,
    items: [
      { id: '/positions', label: 'Positions', icon: Boxes },
      { id: '/ledger', label: 'Trade Ledger', icon: BarChart3 },
      { id: '/performance', label: 'Performance', icon: LineChart },
    ],
  },
  {
    label: 'Market',
    icon: Activity,
    items: [
      { id: '/live', label: 'Live', icon: Activity },
      { id: '/discovery', label: 'Option Discovery', icon: Radar },
    ],
  },
  {
    label: 'Research',
    icon: Radar,
    subGroups: [
      {
        label: 'Analyze',
        items: [
          { id: '/research/dossier', label: 'Dossier' },
          { id: '/research/greeks', label: 'IV & Greeks' },
        ],
      },
      {
        label: 'Data',
        items: [
          { id: '/research/screener', label: 'Stock Screener' },
          { id: '/research/watchlist', label: 'Watchlist' },
        ],
      },
    ],
  },
  {
    label: 'Support',
    icon: Settings,
    emphasis: 'secondary',
    dividerBefore: true,
    items: [{ id: '/settings', label: 'Settings', icon: Settings }],
  },
]

const OPS_GROUPS: ShellNavGroup[] = [
  {
    label: 'Mission',
    icon: Radar,
    defaultOpen: true,
    items: [
      { id: 'control-room', label: 'Control Room', icon: Radar },
      { id: 'operate', label: 'Operate Queue', icon: Boxes },
      { id: 'release', label: 'Release Gate', icon: BarChart3 },
    ],
  },
  {
    label: 'Data Plane',
    icon: Database,
    items: [
      { id: 'market-data', label: 'Market Data', icon: Database },
      { id: 'postgres', label: 'Postgres', icon: Database },
    ],
  },
]

/** The Trade console: flat groups, sub-grouped groups, a quieter `secondary`
    Support group behind a divider, and one active route. */
export const TradeConsole = () => (
  <Shell>
    <ShellNavSidebar
      productName="Bifrost Trade"
      navGroups={TRADE_GROUPS}
      activeId="/positions"
      onSelect={() => {}}
    />
  </Shell>
)

/** The Ops console off the same renderer: `productBadge` says which console,
    `productContext` says which Task Mode is live, and `peerApp` is the link
    back to the other one. */
export const OpsConsole = () => (
  <Shell>
    <ShellNavSidebar
      productName="Bifrost Ops"
      productBadge="Ops"
      productContext="Satellite Build"
      navGroups={OPS_GROUPS}
      activeId="control-room"
      onSelect={() => {}}
      peerApp={{
        label: 'Bifrost Trade',
        href: 'http://127.0.0.1:5173',
        description: 'Positions, ledger and research',
      }}
      docLinks={[
        { id: 'facts', label: 'AGENT_FACTS', href: '#facts' },
        { id: 'spine', label: 'Decision spine', href: '#spine' },
      ]}
    />
  </Shell>
)

/** Collapsed to the icon rail (`SidebarProvider defaultOpen={false}`). Group
    icons become the whole navigation; each opens a popover flyout of its items,
    which is why `ShellNavGroup.icon` is effectively required. */
export const CollapsedIconRail = () => (
  <Shell open={false}>
    <ShellNavSidebar
      productName="Bifrost Trade"
      navGroups={TRADE_GROUPS}
      activeId="/positions"
      onSelect={() => {}}
    />
  </Shell>
)
