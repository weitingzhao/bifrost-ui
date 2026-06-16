import { cn } from '../lib/cn'

export type DenseTagVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info'
  | 'category'

export type DenseTagSize = 'cell' | 'pill'

const shellBySize: Record<DenseTagSize, string> = {
  cell: 'inline-block rounded-full border text-dense-meta font-medium px-[0.45rem] py-[0.1rem]',
  pill: 'inline-block rounded-full border text-xs font-semibold px-2 py-0.5',
}

const variantByType: Record<DenseTagVariant, Record<DenseTagSize, string>> = {
  category: {
    cell: 'border-border text-muted-foreground font-medium',
    pill: 'border-border text-muted-foreground font-semibold',
  },
  success: {
    cell: 'border-emerald-500/45 text-emerald-600 dark:text-emerald-400',
    pill: 'border-emerald-500/45 text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    cell: 'border-amber-500/45 text-amber-700 dark:text-amber-400',
    pill: 'border-amber-500/45 text-amber-700 dark:text-amber-400',
  },
  danger: {
    cell: 'border-red-500/45 text-red-600 dark:text-red-400',
    pill: 'border-red-500/45 text-red-600 dark:text-red-400',
  },
  neutral: {
    cell: 'border-border text-muted-foreground',
    pill: 'border-border text-muted-foreground',
  },
  info: {
    cell: 'border-sky-500/45 text-sky-700 dark:text-sky-400',
    pill: 'border-sky-500/45 text-sky-700 dark:text-sky-400',
  },
}

export function denseTagClass(
  variant: DenseTagVariant = 'category',
  size: DenseTagSize = 'cell',
  className?: string,
): string {
  return cn(shellBySize[size], variantByType[variant][size], className)
}
