import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import {
  DEFAULT_SEGMENT_SIZE,
  segmentButtonClass,
  segmentGroupClass,
  type SegmentControlSize,
} from './segmentClasses'

export type SegmentOption = {
  value: string
  label: ReactNode
  disabled?: boolean
}

export function SegmentControl({
  options,
  value,
  onChange,
  className,
  size = DEFAULT_SEGMENT_SIZE,
  ariaLabel,
}: {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: SegmentControlSize
  ariaLabel?: string
}) {
  return (
    <div
      className={cn(segmentGroupClass(size), className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          disabled={opt.disabled}
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={segmentButtonClass(value === opt.value, size)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
