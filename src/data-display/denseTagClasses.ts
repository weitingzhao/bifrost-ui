import { cn } from '../lib/cn'

export type DenseTagVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'category'

export type DenseTagSize = 'cell' | 'pill'

/**
 * The capsule (design 1a, Rev .62; the default since 0.5.0): no frame, the
 * variant's own ink at 15% behind it, fully round, 8px sides. The variant
 * sets only the ink; the fill follows it through currentColor. Increase
 * contrast adds an inset line of the same ink (materials.css).
 */
export const DENSE_TAG_SHELL: Record<DenseTagSize, string> = {
  cell: 'inline-block rounded-full border-0 bg-[color-mix(in_srgb,currentColor_15%,transparent)] text-dense-meta font-medium px-2 py-[0.1rem]',
  pill: 'inline-block rounded-full border-0 bg-[color-mix(in_srgb,currentColor_15%,transparent)] text-xs font-semibold px-2 py-0.5',
}

const shellBySize = DENSE_TAG_SHELL

const variantByType: Record<DenseTagVariant, Record<DenseTagSize, string>> = {
  category: {
    cell: 'text-muted-foreground font-medium',
    pill: 'text-muted-foreground font-semibold',
  },
  success: {
    cell: 'text-emerald-700 dark:text-emerald-400',
    pill: 'text-emerald-700 dark:text-emerald-400',
  },
  warning: {
    cell: 'text-amber-700 dark:text-amber-400',
    pill: 'text-amber-700 dark:text-amber-400',
  },
  danger: {
    cell: 'text-red-700 dark:text-red-400',
    pill: 'text-red-700 dark:text-red-400',
  },
  neutral: {
    cell: 'text-muted-foreground',
    pill: 'text-muted-foreground',
  },
  info: {
    cell: 'text-sky-700 dark:text-sky-400',
    pill: 'text-sky-700 dark:text-sky-400',
  },
}

export function denseTagClass(
  variant: DenseTagVariant = 'category',
  size: DenseTagSize = 'cell',
  className?: string,
): string {
  return cn(shellBySize[size], variantByType[variant][size], className)
}
