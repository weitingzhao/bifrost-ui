import { Button, PanelHead } from '@bifrost/ui'

/** A panel to put the head on: the glass reaches the head, so it has no band
    of its own — only the ink 8% hairline. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-background p-4 text-foreground">
      <div
        className="flex w-full flex-col overflow-hidden"
        style={{ maxWidth: 520, borderRadius: 14, background: 'var(--glass-bg-float)', boxShadow: 'var(--glass-lens), var(--glass-drop)' }}
      >
        {children}
        <div className="p-4 text-dense-body text-muted-foreground">Fill the left, watch the right.</div>
      </div>
    </div>
  )
}

/** One row: title · meta · actions · the round close (§17.5, Rev .151). */
export const Inline = () => (
  <Panel>
    <PanelHead
      title="Plan a trade"
      meta="Nothing is sent anywhere until you create the intent — and even then, TWS is where you click."
      onClose={() => {}}
    />
  </Panel>
)

/** Stacked: a caption, the title and a mono second line — a drawer or the
    inspector — with an action before the close. */
export const Stacked = () => (
  <Panel>
    <PanelHead
      layout="stacked"
      kicker="Run"
      title="Daily loop · stocks"
      meta="r-0918-2 · awaiting you"
      actions={
        <Button variant="ghost" size="xs">
          Journal →
        </Button>
      }
      onClose={() => {}}
      closeTitle="Close · esc"
    />
  </Panel>
)
