import { ConfirmDialog, DenseTag } from '@bifrost/ui'

/** The standard destructive confirm: title names the object, message names the
    consequence, and the confirm button is `destructive`. `open` is controlled
    by the caller — there is no internal trigger. */
export const Destructive = () => (
  <ConfirmDialog
    open
    title="Delete this execution?"
    message="NVDA 2026-11-21 190 C · −2 contracts filled at 8.42 on 2026-09-08. Removing it recomputes the strategy's realised P&L and its win-rate contribution."
    confirmLabel="Delete execution"
    onConfirm={() => {}}
    onCancel={() => {}}
  />
)

/** `bodyExtra` carries whatever the reader needs to check before answering —
    here the rows that would be recomputed. Keep it to facts, not more prose. */
export const WithBodyExtra = () => (
  <ConfirmDialog
    open
    title="Unassign this strategy?"
    message="Three open legs currently roll up to it. They stay open — they just stop being counted against the strategy."
    confirmLabel="Unassign"
    bodyExtra={
      <div className="flex flex-col gap-1.5 rounded-md border border-border bg-secondary/30 p-2 text-dense-body">
        <div className="flex items-center gap-2">
          <DenseTag variant="neutral">leg</DenseTag>
          <span className="font-mono tabular-nums">NVDA 2026-11-21 190 C</span>
          <span className="ml-auto font-mono tabular-nums text-muted-foreground">−2</span>
        </div>
        <div className="flex items-center gap-2">
          <DenseTag variant="neutral">leg</DenseTag>
          <span className="font-mono tabular-nums">NVDA 2026-11-21 195 C</span>
          <span className="ml-auto font-mono tabular-nums text-muted-foreground">−1</span>
        </div>
        <div className="flex items-center gap-2">
          <DenseTag variant="neutral">stock</DenseTag>
          <span className="font-mono tabular-nums">NVDA</span>
          <span className="ml-auto font-mono tabular-nums text-muted-foreground">+250</span>
        </div>
      </div>
    }
    onConfirm={() => {}}
    onCancel={() => {}}
  />
)

/** `confirming` — the write is in flight. Both buttons disable and the confirm
    label collapses to an ellipsis, so a second click cannot double-submit. */
export const Confirming = () => (
  <ConfirmDialog
    open
    confirming
    title="Delete this execution?"
    message="NVDA 2026-11-21 190 C · −2 contracts filled at 8.42 on 2026-09-08."
    confirmLabel="Delete execution"
    onConfirm={() => {}}
    onCancel={() => {}}
  />
)
