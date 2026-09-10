import { DenseTag } from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** The six variants at `size="cell"` — the in-table size, sitting on the dense
    13px baseline without pushing the row height. */
export const Variants = () => (
  <Surface>
    <div className="flex flex-wrap items-center gap-2">
      <DenseTag variant="success">filled</DenseTag>
      <DenseTag variant="warning">partial</DenseTag>
      <DenseTag variant="danger">rejected</DenseTag>
      <DenseTag variant="info">working</DenseTag>
      <DenseTag variant="neutral">cancelled</DenseTag>
      <DenseTag variant="category">Semiconductors</DenseTag>
    </div>
  </Surface>
)

/** `size="pill"` — the standalone size for toolbars and headers, where the tag
    is the only thing on its line. */
export const Sizes = () => (
  <Surface>
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-10 text-dense-meta text-muted-foreground">cell</span>
        <DenseTag variant="success" size="cell">SPY 640C</DenseTag>
        <DenseTag variant="warning" size="cell">7 DTE</DenseTag>
        <DenseTag variant="category" size="cell">Covered Call</DenseTag>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-10 text-dense-meta text-muted-foreground">pill</span>
        <DenseTag variant="success" size="pill">SPY 640C</DenseTag>
        <DenseTag variant="warning" size="pill">7 DTE</DenseTag>
        <DenseTag variant="category" size="pill">Covered Call</DenseTag>
      </div>
    </div>
  </Surface>
)

/** In place: category tags label the group, status tags label the row. The
    variant carries the meaning — never the position in the row. */
export const InAStatusRow = () => (
  <Surface>
    <div className="flex flex-col gap-2 text-dense-body">
      <div className="flex items-center gap-2">
        <span className="w-24 font-mono tabular-nums">NVDA</span>
        <DenseTag variant="category">Semiconductors</DenseTag>
        <DenseTag variant="success">filled</DenseTag>
        <span className="ml-auto text-muted-foreground">2 contracts</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-24 font-mono tabular-nums">TLT</span>
        <DenseTag variant="category">Fixed Income</DenseTag>
        <DenseTag variant="warning">partial</DenseTag>
        <span className="ml-auto text-muted-foreground">1 of 4</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-24 font-mono tabular-nums">SMCI</span>
        <DenseTag variant="category">Semiconductors</DenseTag>
        <DenseTag variant="danger">rejected</DenseTag>
        <span className="ml-auto text-muted-foreground">margin</span>
      </div>
    </div>
  </Surface>
)
