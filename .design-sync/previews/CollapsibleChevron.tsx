import { CollapsibleChevron } from '@bifrost/ui'
import { useState } from 'react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** The disclosure glyph shared by every collapsible surface in the system:
    down when folded, rotated 180° when open, with a colour-free transition so
    the rotation itself is the signal. */
export const BothStates = () => (
  <Surface>
    <div className="flex flex-col gap-3 text-dense-body">
      <div className="flex items-center gap-2">
        <CollapsibleChevron expanded={false} />
        <span className="text-muted-foreground">expanded={'{false}'} — folded</span>
      </div>
      <div className="flex items-center gap-2">
        <CollapsibleChevron expanded />
        <span className="text-muted-foreground">expanded — open</span>
      </div>
    </div>
  </Surface>
)

/** In place, inside a header button. It is `h-3.5 w-3.5` and `shrink-0`, so it
    holds its width while the title beside it truncates. */
export const InAHeader = () => {
  const [open, setOpen] = useState(true)
  return (
    <Surface>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-left text-dense-body"
      >
        <CollapsibleChevron expanded={open} />
        <span className="truncate font-semibold">NVDA — Covered Call, Nov 21</span>
        <span className="ml-auto shrink-0 text-dense-meta text-muted-foreground">4 legs</span>
      </button>
    </Surface>
  )
}
