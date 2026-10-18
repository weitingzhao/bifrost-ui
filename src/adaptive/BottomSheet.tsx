/**
 * The bottom sheet (Trade design Rev .174 B1, DESIGN_CONTRACTS §18.5) — what
 * every float becomes on compact, and a shell's confirm sheet everywhere.
 * Promoted as-is from Trade's `components/ui/BottomSheet.tsx`.
 *
 * - **compact**: pinned to the bottom edge, two detents — half (62%) and full
 *   (the top keeps the safe area + 10). The grip: a tap switches detents, a
 *   drag up past 48 goes full, a drag down past 72 drops full to half and
 *   half to closed. A tap on the scrim closes. `material="view"` is the float
 *   glass and opens half; `"edit"` is opaque and opens full (dense fields
 *   never sit on blur).
 * - **everywhere else** (and with no `LayoutProvider`): a form sheet dropped
 *   from under the top bar, centred, 480 wide.
 *
 * Keys: Enter runs the footer's rightmost action (`sheetEnter`), Esc closes.
 * Built on Radix's dialog for the focus trap, the portal and Esc. The look is
 * in `@bifrost/ui/styles/layout` (`[data-slot="bottom-sheet"]`).
 */
import * as React from 'react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { XIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { sheetEnter } from '../ui/dialog'
import { useLayoutProvided } from './LayoutProvider'
import { SheetGrip } from './SheetGrip'

export interface BottomSheetAction {
  /** The button's words — a node, so a trade number can keep its ink and mono. */
  label: React.ReactNode
  /** Drawn as the primary (accent) — the rightmost action is what Enter runs. */
  primary?: boolean
  disabled?: boolean
  /** Says why, when it is disabled — the button's own title. */
  title?: string
  /** Runs after the sheet starts closing. */
  onRun?: () => void
  /** Keep the sheet open after running (a toggle, a step). */
  keepOpen?: boolean
}

export interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The head's title; `head` replaces the whole head instead (`false`: no head). */
  title?: React.ReactNode
  /** A mono reading after the title (a count, a key). */
  meta?: React.ReactNode
  head?: React.ReactNode
  /** The accessible name, when the title is not plain text. */
  label?: string
  /** `view` — glass, opens half; `edit` — opaque, opens full. */
  material?: 'view' | 'edit'
  /** The detent it opens at on compact (default: half for view, full for edit). */
  detent?: 'half' | 'full'
  actions?: readonly BottomSheetAction[]
  children?: React.ReactNode
  bodyClassName?: string
  /** No body padding: the caller lays its content edge to edge (a tab strip, a list). */
  flush?: boolean
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  meta,
  head,
  label,
  material = 'view',
  detent,
  actions,
  children,
  bodyClassName,
  flush = false,
}: BottomSheetProps) {
  const compact = useLayoutProvided()?.w === 'compact'
  const startFull = (detent ?? (material === 'edit' ? 'full' : 'half')) === 'full'
  const [full, setFull] = React.useState(startFull)
  // A sheet re-opened starts at its own detent again, not where it was dragged.
  const [seen, setSeen] = React.useState(open)
  if (open !== seen) {
    setSeen(open)
    if (open) setFull(startFull)
  }
  const ref = React.useRef<HTMLDivElement>(null)
  const acts = actions ?? []
  const place = compact ? 'bottom' : 'form'

  const run = (a: BottomSheetAction) => {
    if (a.disabled) return
    if (!a.keepOpen) onOpenChange(false)
    a.onRun?.()
  }

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay data-slot="bottom-sheet-scrim" data-place={place} />
        <SheetPrimitive.Content
          ref={ref}
          data-slot="bottom-sheet"
          data-sr-bsheet={material}
          data-place={place}
          data-sr-detent={compact && full ? 'full' : undefined}
          aria-label={label ?? (typeof title === 'string' ? title : undefined)}
          aria-describedby={undefined}
          tabIndex={-1}
          // Focus the sheet, not its first control: a ring on ✕ the moment a
          // sheet opens reads as a pressed close.
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ref.current?.focus({ preventScroll: true })
          }}
          onKeyDown={(e) => {
            if (e.defaultPrevented) return
            // The footer's buttons are this sheet's own; sheetEnter reads them by slot.
            sheetEnter(e, e.currentTarget)
          }}
        >
          {compact ? <SheetGrip sheet={ref} full={full} onDetent={setFull} onClose={() => onOpenChange(false)} /> : null}
          {head ?? (
            <div data-slot="bottom-sheet-head" data-sr-head="">
              <SheetPrimitive.Title data-slot="bottom-sheet-title">{title}</SheetPrimitive.Title>
              {meta != null ? <span data-slot="bottom-sheet-meta">{meta}</span> : null}
              <SheetPrimitive.Close data-slot="bottom-sheet-close" data-sr-close="" data-hit="" aria-label="Close" title="Close">
                <XIcon aria-hidden />
              </SheetPrimitive.Close>
            </div>
          )}
          {head != null ? <SheetPrimitive.Title className="sr-only">{label ?? title}</SheetPrimitive.Title> : null}
          <div data-slot="bottom-sheet-body" data-flush={flush ? '' : undefined} className={cn(bodyClassName)}>
            {children}
          </div>
          {acts.length > 0 ? (
            <div data-slot="dialog-footer" data-sheet-foot="">
              {acts.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  data-slot="bottom-sheet-action"
                  data-primary={a.primary ? '1' : undefined}
                  disabled={a.disabled}
                  title={a.title}
                  onClick={() => run(a)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  )
}
