import { BottomSheet, Input, LayoutProvider } from '@bifrost/ui'

/** A phone's page under the sheet: the sheet is the float every popover,
    dialog and row detail becomes on compact, so it needs a page behind it. */
function Page({ children }: { children: React.ReactNode }) {
  const rows = [
    ['NVDA', 'NOV21 170P', '−2', '4.10'],
    ['AAPL', 'NOV21 245C', '−1', '2.35'],
    ['MSFT', 'DEC19 480P', '−1', '6.80'],
    ['TSLA', 'NOV21 380P', '−1', '9.15'],
    ['AMD', 'NOV21 150P', '−3', '3.05'],
    ['META', 'DEC19 560P', '−1', '7.40'],
  ]
  return (
    <div className="flex h-svh flex-col gap-1 bg-background p-4 text-foreground">
      <div className="pb-2 text-base font-semibold">Positions</div>
      {rows.map(([s, c, q, p]) => (
        <div key={c} className="flex items-center gap-3 py-2 font-mono text-dense-body tabular-nums">
          <span className="w-12 font-semibold">{s}</span>
          <span className="flex-1">{c}</span>
          <span>{q}</span>
          <span className="w-12 text-right">{p}</span>
        </div>
      ))}
      {children}
    </div>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-dense-body">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono tabular-nums">{v}</span>
    </div>
  )
}

/** Compact, `material="view"`: floating glass pinned to the bottom edge at the
    half detent, with the grip. Tap the grip to switch detents, drag up past 48
    for full, down past 72 to drop a detent or close. The rightmost action is
    the primary and the one Enter runs. A LayoutProvider is what makes it
    compact — without one it is the desk's form sheet. */
export const PhoneView = () => (
  <LayoutProvider override={{ w: 'compact', h: 'tall', input: 'touch' }}>
    <Page>
      <BottomSheet
        open
        onOpenChange={() => {}}
        title="NVDA NOV21 170P"
        meta="#155"
        material="view"
        actions={[
          { label: 'Ledger →', onRun: () => {} },
          { label: 'Roll or close →', primary: true, onRun: () => {} },
        ]}
      >
        <Fact k="Opened" v="8 Sep · 4.10" />
        <Fact k="Contracts" v="−2" />
        <Fact k="Mark" v="1.85" />
        <Fact k="Unrealized" v="+$450.00" />
        <Fact k="Days to expiry" v="35" />
      </BottomSheet>
    </Page>
  </LayoutProvider>
)

/** Compact, `material="edit"`: opaque and open at the full detent — a form is
    never read through glass. */
export const PhoneEdit = () => (
  <LayoutProvider override={{ w: 'compact', h: 'tall', input: 'touch' }}>
    <Page>
      <BottomSheet
        open
        onOpenChange={() => {}}
        title="Edit alert"
        material="edit"
        actions={[
          { label: 'Cancel', onRun: () => {} },
          { label: 'Save', primary: true, onRun: () => {} },
        ]}
      >
        <div className="flex flex-col gap-3 py-2 text-dense-body">
          <label className="flex flex-col gap-1">
            <span className="text-dense-meta font-semibold text-muted-foreground">Symbol</span>
            <Input defaultValue="NVDA" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-dense-meta font-semibold text-muted-foreground">Price at or below</span>
            <Input defaultValue="168.00" />
          </label>
        </div>
      </BottomSheet>
    </Page>
  </LayoutProvider>
)

/** No LayoutProvider (or any class above compact): the same component drops
    from under the top bar as a centred 480 form sheet; Esc closes it. */
export const DeskForm = () => (
  <Page>
    <BottomSheet
      open
      onOpenChange={() => {}}
      title="Record answer"
      material="edit"
      actions={[
        { label: 'Dismiss', onRun: () => {} },
        { label: 'Record answer', primary: true, onRun: () => {} },
      ]}
    >
      <p className="m-0 py-2 text-dense-body text-muted-foreground">
        Is the NVDA earnings move inside the 30-day IV the screen priced? The answer is written to the Book.
      </p>
    </BottomSheet>
  </Page>
)
