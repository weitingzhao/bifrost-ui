import { DenseTag, LayoutProvider, useLayout } from '@bifrost/ui'

/** What every adaptive component reads: `useLayout()` under the provider. */
function Axes() {
  const l = useLayout()
  const rows: [string, string, string][] = [
    ['w', l.w, 'compact < 600 · medium < 1024 · expanded < 1440 · wide'],
    ['h', l.h, 'short < 900 · tall'],
    ['input', l.input, 'the last pointerType — mouse, pen and trackpad are pointer'],
    ['keys', l.keys ? 'yes' : 'no', 'a key pressed outside a text field'],
    ['dock', l.dock ? 'yes' : 'no', 'wide, and main (the content area) ≥ 1200'],
  ]
  return (
    <div className="panel-elevated flex flex-col gap-1 p-4 text-dense-body">
      {rows.map(([k, v, why]) => (
        <div key={k} className="flex items-center gap-3 py-1">
          <span className="w-14 font-mono text-muted-foreground">{k}</span>
          <DenseTag>{v}</DenseTag>
          <span className="text-muted-foreground">{why}</span>
        </div>
      ))}
      <p className="m-0 pt-2 text-dense-meta text-muted-foreground">
        Written on &lt;html&gt; as data-w · data-h · data-input · data-keys · data-dock · data-safe; a crossing fires
        bifrost:layout. One provider per document, at the app root.
      </p>
    </div>
  )
}

/** A phone: the axes pinned with `override` (a variant page, a test). In an
    app the provider measures the window, the pointer and `main` itself. */
export const Phone = () => (
  <div className="bg-background p-4 text-foreground">
    <LayoutProvider override={{ w: 'compact', h: 'tall', input: 'touch' }}>
      <Axes />
    </LayoutProvider>
  </div>
)

/** A 13″ laptop: expanded and short — the short density, the dock bar that
    steps aside, sections listed in `foldAt={['short']}` folded. */
export const Laptop = () => (
  <div className="bg-background p-4 text-foreground">
    <LayoutProvider override={{ w: 'expanded', h: 'short', input: 'pointer' }}>
      <Axes />
    </LayoutProvider>
  </div>
)
