import { DenseTag, UndoToast } from '@bifrost/ui'

/** The toast is `fixed` at the bottom centre, so the card is a page-sized
    ground with the list it acted on. */
function Page({ children }: { children: React.ReactNode }) {
  const rows = [
    ['AAPL', 'Covered call', 'NOV21 245C'],
    ['MSFT', 'Put spread', 'DEC19 480/470P'],
    ['META', 'Short put', 'DEC19 640P'],
    ['GOOGL', 'Covered call', 'DEC19 270C'],
  ]
  return (
    <div className="flex h-svh flex-col gap-1 bg-background p-6 text-foreground">
      {rows.map(([sym, structure, legs]) => (
        <div key={sym} className="flex items-center gap-3 py-1.5 text-dense-body">
          <span className="w-14 font-mono font-semibold">{sym}</span>
          <span className="w-28 text-muted-foreground">{structure}</span>
          <span className="flex-1 font-mono tabular-nums">{legs}</span>
          <DenseTag variant="neutral">draft</DenseTag>
        </div>
      ))}
      {children}
    </div>
  )
}

/** Delete without asking, then offer the way back. The capsule closes itself
    after `duration` (5s); while it is up ⌘Z / Ctrl+Z calls the same undo
    (`hotkey`, on by default — turn it off when the page binds ⌘Z itself). */
export const Deleted = () => (
  <Page>
    <UndoToast open message="Deleted NVDA · Short put" onAction={() => {}} onClose={() => {}} />
  </Page>
)

/** `actionLabel="Show"` for a new object the current filter hides. The ⌘Z hint
    only shows for Undo. */
export const HiddenByFilter = () => (
  <Page>
    <UndoToast
      open
      message="Duplicated as TSLA · Iron condor — hidden by the Symbol filter"
      actionLabel="Show"
      onAction={() => {}}
      onClose={() => {}}
    />
  </Page>
)
