import { IconActionButton } from '@bifrost/ui'
import { Copy, ExternalLink, Pencil, RefreshCw, Trash2, TriangleAlert } from 'lucide-react'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

const noop = () => {}

/** The row-action cluster: edit, copy, open, delete. Every button carries both
    a `title` (hover) and an `ariaLabel` — an icon alone names nothing. */
export const RowActions = () => (
  <Surface>
    <div className="flex items-center gap-1">
      <IconActionButton title="Edit this leg" ariaLabel="Edit this leg" onClick={noop}>
        <Pencil />
      </IconActionButton>
      <IconActionButton title="Copy contract symbol" ariaLabel="Copy contract symbol" onClick={noop}>
        <Copy />
      </IconActionButton>
      <IconActionButton title="Open in Option Discovery" ariaLabel="Open in Option Discovery" onClick={noop}>
        <ExternalLink />
      </IconActionButton>
      <IconActionButton tone="danger" title="Delete this leg" ariaLabel="Delete this leg" onClick={noop}>
        <Trash2 />
      </IconActionButton>
    </div>
  </Surface>
)

/** The three tones. `danger` is destructive, `warn` is reversible but wants a
    second look, `default` is everything else. */
export const Tones = () => (
  <Surface>
    <div className="flex flex-col gap-2 text-dense-body">
      <div className="flex items-center gap-2">
        <IconActionButton title="Refresh quotes" ariaLabel="Refresh quotes" onClick={noop}>
          <RefreshCw />
        </IconActionButton>
        <span className="text-muted-foreground">default — refresh quotes</span>
      </div>
      <div className="flex items-center gap-2">
        <IconActionButton tone="warn" title="Re-run with stale inputs" ariaLabel="Re-run with stale inputs" onClick={noop}>
          <TriangleAlert />
        </IconActionButton>
        <span className="text-muted-foreground">warn — re-run with stale inputs</span>
      </div>
      <div className="flex items-center gap-2">
        <IconActionButton tone="danger" title="Delete execution" ariaLabel="Delete execution" onClick={noop}>
          <Trash2 />
        </IconActionButton>
        <span className="text-muted-foreground">danger — delete execution</span>
      </div>
    </div>
  </Surface>
)

/** `size="dense"` (28px, the default) sits inside a dense table row without
    growing it; `size="icon"` (32px) is for toolbars. Disabled keeps its slot. */
export const SizesAndDisabled = () => (
  <Surface>
    <div className="flex flex-col gap-3 text-dense-body">
      <div className="flex items-center gap-2">
        <IconActionButton size="dense" title="Edit" ariaLabel="Edit" onClick={noop}>
          <Pencil />
        </IconActionButton>
        <span className="text-muted-foreground">dense — 28px, table rows</span>
      </div>
      <div className="flex items-center gap-2">
        <IconActionButton size="icon" title="Edit" ariaLabel="Edit" onClick={noop}>
          <Pencil />
        </IconActionButton>
        <span className="text-muted-foreground">icon — 32px, toolbars</span>
      </div>
      <div className="flex items-center gap-2">
        <IconActionButton disabled title="Nothing to delete" ariaLabel="Nothing to delete" onClick={noop}>
          <Trash2 />
        </IconActionButton>
        <span className="text-muted-foreground">disabled — still occupies the column</span>
      </div>
    </div>
  </Surface>
)
