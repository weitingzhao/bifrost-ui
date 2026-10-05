import { cn } from '../lib/cn'

export type SegmentControlSize = 'xs' | 'sm' | 'md'

export const DEFAULT_SEGMENT_SIZE: SegmentControlSize = 'sm'

/**
 * The selected segment (0.11.0, design §17.10 · Owner decision #3): ink 15%
 * with the lens and a 1px drop — the same as PageHead's capsule tabs. It reads
 * no surface token, so a page that makes `--card` transparent (Trade's frost)
 * keeps the selection visible.
 */
export const SEGMENT_CTRL_ACTIVE =
  'bg-[color-mix(in_srgb,var(--foreground)_15%,transparent)] text-foreground font-semibold shadow-[var(--glass-lens),0_1px_2px_rgba(0,0,0,0.22)] z-[1]'

export const SEGMENT_CTRL_IDLE =
  'bg-transparent text-muted-foreground font-medium hover:bg-muted/40 hover:text-foreground'

const groupBySize: Record<SegmentControlSize, string> = {
  xs: 'gap-px p-[2px]',
  sm: 'gap-0.5 p-[3px]',
  md: 'gap-1 p-1',
}

const btnBySize: Record<SegmentControlSize, string> = {
  xs: 'px-2 py-0.5 text-dense-label leading-none',
  sm: 'px-3 py-1 text-dense-label',
  md: 'px-3.5 py-1.5 text-sm',
}

/** The track is a control (1a, 0.5.1): ink fill, no frame; the 1px stays so the size does not move. */
export function segmentGroupClass(size: SegmentControlSize = 'sm'): string {
  return cn(
    'inline-flex items-center rounded-full border border-transparent bg-[var(--control-fill)]',
    groupBySize[size],
  )
}

export function segmentButtonClass(active: boolean, size: SegmentControlSize = 'sm'): string {
  return cn(
    // nowrap: a label never folds inside its pill (Rev .93 — "1 month" broke at 650px of content).
    'rounded-full border-0 font-semibold leading-tight whitespace-nowrap transition-colors cursor-pointer',
    'disabled:cursor-not-allowed disabled:opacity-70',
    btnBySize[size],
    active ? SEGMENT_CTRL_ACTIVE : SEGMENT_CTRL_IDLE,
  )
}
