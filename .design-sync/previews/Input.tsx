import { Input } from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** Frameless, a 7% ink fill, radius 8. Focus draws a 3px accent glow instead
    of a border. Labels sit above, in the muted meta size. */
export const Fields = () => (
  <Surface>
    <div className="flex w-80 flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-dense-meta text-muted-foreground">Symbol</span>
        <Input placeholder="NVDA, AMD, SPY…" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-dense-meta text-muted-foreground">Note</span>
        <Input defaultValue="Rolled from the Oct 17 expiry" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-dense-meta text-muted-foreground">Account</span>
        <Input defaultValue="Margin" disabled />
      </label>
    </div>
  </Surface>
)

/** Focused: the accent glow. */
export const Focused = () => (
  <Surface>
    <div className="w-80">
      <Input autoFocus defaultValue="AVGO" />
    </div>
  </Surface>
)
