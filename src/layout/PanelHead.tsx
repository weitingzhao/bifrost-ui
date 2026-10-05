/**
 * PanelHead (Trade design Rev .151 · `data-sr-head`): the one head for every
 * sheet, drawer and inspector. Transparent, an ink 8% hairline under it, 12×16,
 * one row — title · meta · actions · the round close. The glass behind reaches
 * it; there is no band of its own.
 *
 * The look lives on the attribute (`styles/patterns`), so a hand-built head can
 * carry `data-sr-head` and match.
 */
import * as React from 'react'

import { cn } from '../lib/cn'
import { IconActionButton } from '../data-display/IconActionButton'

export interface PanelHeadProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** The heading. Pass a `DialogTitle` / `SheetTitle` inside a dialog so it names it. */
  title: React.ReactNode
  /** A small caption before the title (`RUN`, `Rule`). */
  kicker?: React.ReactNode
  /** Secondary text: after the title on the same row (`inline`), or under it (`stacked`). */
  meta?: React.ReactNode
  /** `inline` (default): one row, the meta truncating. `stacked`: meta on a second line. */
  layout?: 'inline' | 'stacked'
  /** Buttons or links before the close, pushed to the right. */
  actions?: React.ReactNode
  /** Renders the round close (`IconActionButton variant="close"`). */
  onClose?: () => void
  /** The close's label and hover text (default `Close`). */
  closeLabel?: string
  closeTitle?: string
}

export const PanelHead = React.forwardRef<HTMLElement, PanelHeadProps>(function PanelHead(
  { title, kicker, meta, layout = 'inline', actions, onClose, closeLabel, closeTitle, className, ...rest },
  ref,
) {
  const stacked = layout === 'stacked'
  return (
    <header ref={ref} data-sr-head="" data-slot="panel-head" className={cn('min-w-0', className)} {...rest}>
      {stacked ? (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {kicker ? <span className="text-[11px] font-semibold text-muted-foreground">{kicker}</span> : null}
          <span className="truncate text-[14px] font-semibold leading-tight text-foreground">{title}</span>
          {meta ? <span className="truncate font-mono text-[11px] text-muted-foreground">{meta}</span> : null}
        </div>
      ) : (
        <>
          {kicker ? <span className="flex-none text-[11px] font-semibold text-muted-foreground">{kicker}</span> : null}
          <span className="min-w-0 truncate text-[14px] font-semibold leading-tight text-foreground">{title}</span>
          {meta ? (
            <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--sk-mute2,var(--muted-foreground))]">{meta}</span>
          ) : (
            <span className="flex-1" />
          )}
        </>
      )}
      {actions ? <div className="flex flex-none items-center gap-1.5">{actions}</div> : null}
      {onClose ? (
        <IconActionButton
          variant="close"
          onClick={onClose}
          ariaLabel={closeLabel ?? 'Close'}
          title={closeTitle ?? closeLabel ?? 'Close'}
        />
      ) : null}
    </header>
  )
})
