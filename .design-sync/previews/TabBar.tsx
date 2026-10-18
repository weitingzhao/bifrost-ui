import { LayoutProvider, TabBar } from '@bifrost/ui'
import { BarChart3, Compass, Home, LayoutGrid, Wallet } from 'lucide-react'

const ITEMS = [
  { id: 'home', label: 'Home', icon: <Home /> },
  { id: 'trade', label: 'Trade', icon: <BarChart3 /> },
  { id: 'portfolio', label: 'Portfolio', icon: <Wallet /> },
  { id: 'research', label: 'Research', icon: <Compass /> },
  { id: 'more', label: 'More', icon: <LayoutGrid /> },
]

/** Card-only frame: the bar is `position: fixed` to the viewport bottom; a
    transform here makes this box its containing block so the card shows the
    whole bar. An app mounts TabBar at its root with no such wrapper. */
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden" style={{ transform: 'translateZ(0)', width: 393, height: 380 }}>
      {children}
    </div>
  )
}

function Page() {
  const rows = [
    ['Net liquidation', '$412,880'],
    ['Day P&L', '+$1,240'],
    ['Buying power', '$96,410'],
    ['Open legs', '23'],
  ]
  return (
    <div className="flex h-full flex-col gap-1 bg-background p-4 text-foreground">
      <div className="pb-2 text-base font-semibold">Portfolio</div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between py-2 text-dense-body">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-mono tabular-nums">{v}</span>
        </div>
      ))}
    </div>
  )
}

/** Compact only (under a LayoutProvider it draws nothing above compact): five
    cells, a 24 glyph over a 10px label, floating glass with an ink 8% top edge,
    the current cell in the accent. Pressing the current cell again on its own
    root scrolls the page to the top. Height is `--tab-bar-h` plus the home
    indicator's inset. */
export const Portfolio = () => (
  <LayoutProvider override={{ w: 'compact', h: 'tall', input: 'touch' }}>
    <Phone>
      <Page />
      <TabBar items={ITEMS} current="portfolio" onSelect={() => {}} />
    </Phone>
  </LayoutProvider>
)

/** A page no cell owns (a deep link into a desk page): nothing lights. */
export const NothingCurrent = () => (
  <LayoutProvider override={{ w: 'compact', h: 'tall', input: 'touch' }}>
    <Phone>
      <Page />
      <TabBar items={ITEMS} current={null} onSelect={() => {}} />
    </Phone>
  </LayoutProvider>
)
