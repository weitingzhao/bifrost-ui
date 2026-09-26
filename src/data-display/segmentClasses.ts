import { cn } from '../lib/cn'

export type SegmentControlSize = 'xs' | 'sm' | 'md'

export const DEFAULT_SEGMENT_SIZE: SegmentControlSize = 'sm'

export const SEGMENT_CTRL_ACTIVE =
  'bg-card text-foreground font-semibold shadow-sm z-[1]'

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
    'rounded-full border-0 font-semibold leading-tight transition-colors cursor-pointer',
    'disabled:cursor-not-allowed disabled:opacity-70',
    btnBySize[size],
    active ? SEGMENT_CTRL_ACTIVE : SEGMENT_CTRL_IDLE,
  )
}
