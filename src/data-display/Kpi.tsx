/**
 * KPI boxes (design §17.4, Rev .73/.74) — the `data-sr-kpi` pattern as
 * components, for a page that would rather not write the attributes.
 *
 * - `KpiCard variant="hero"`: 30px reading on the card material.
 * - `KpiStrip`: a row of `KpiCard variant="stat"` (16px) or `panel` (20px)
 *   readings; `inset` when it already sits inside a panel.
 *
 * Labels are 11/600 sentence case, readings mono tabular. A state (warn /
 * danger) shows only as the box's edge colour — the reading keeps its own ink.
 */
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../lib/cn'

export type KpiState = 'warn' | 'danger'

const EDGE: Record<KpiState, string> = {
  warn: 'var(--color-lamp-yellow)',
  danger: 'var(--color-lamp-red)',
}

export interface KpiCardProps {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  /** `hero` 30px on its own card · `stat` 16px · `panel` 20px, both inside a strip. */
  variant?: 'hero' | 'stat' | 'panel'
  state?: KpiState
  /** The reading's own ink (a P&L class, a lamp) — never the state. */
  valueClassName?: string
  className?: string
  title?: string
}

export function KpiCard({ label, value, sub, variant = 'stat', state, valueClassName, className, title }: KpiCardProps) {
  const style: CSSProperties | undefined = state && variant === 'hero' ? { borderColor: EDGE[state] } : undefined
  return (
    <div
      data-sr-kpi={variant === 'hero' ? 'hero' : 'stat'}
      data-state={state}
      className={className}
      style={style}
      title={title}
    >
      <span data-sr-kpi-l="">{label}</span>
      <span data-sr-kpi-v={variant === 'panel' ? 'panel' : ''} className={valueClassName}>
        {value}
      </span>
      {sub != null ? <span data-sr-kpi-s="">{sub}</span> : null}
    </div>
  )
}

export interface KpiStripProps {
  children: ReactNode
  /** Inside a panel already: no card of its own. */
  inset?: boolean
  state?: KpiState
  className?: string
}

export function KpiStrip({ children, inset = false, state, className }: KpiStripProps) {
  return (
    <div
      data-sr-kpi={inset ? 'strip-inset' : 'strip'}
      data-state={state}
      className={cn(className)}
      style={state && !inset ? { borderColor: EDGE[state] } : undefined}
    >
      {children}
    </div>
  )
}
