/**
 * InspectorPanel (Trade design Rev .132 §17.5): select to edit. The selected
 * object is edited in place in a floating glass panel — 320 wide, 8 off the
 * edge, radius 14 — and every field writes back as it changes: there is no
 * Save. ⌘Z undoes (the page's undo stack; a run of typing is one step).
 *
 * Three states:
 * - `none`   nothing selected — the `empty` line says how to get going;
 * - `single` one object — the fields;
 * - `multi`  several — batch fields that apply only to the editable part,
 *            and the panel says how many that is (`batchNote`).
 *
 * An object that is already live (intended, filled, expired) is read-only:
 * `readOnly` gives the reason and the exits (Return to draft · Duplicate) —
 * changing it is an action, not an edit.
 */
import * as React from 'react'
import { X } from 'lucide-react'

import { cn } from '../lib/cn'

export interface InspectorReadOnly {
  /** Why it cannot be edited, in one line. */
  reason: React.ReactNode
  /** The ways out — usually buttons. */
  exits?: React.ReactNode
}

export interface InspectorPanelProps {
  selection: 'none' | 'single' | 'multi'
  /** The heading: the object's name for one, "N selected" for several. */
  title?: React.ReactNode
  /** A second line under the heading (status, id). */
  meta?: React.ReactNode
  /** For `multi`: e.g. "Applies to 3 drafts · 1 filled is skipped". */
  batchNote?: React.ReactNode
  /** For `none`. */
  empty?: React.ReactNode
  readOnly?: InspectorReadOnly | null
  /** The foot line, e.g. "Edits save as you type · ⌘Z undoes". */
  foot?: React.ReactNode
  onClose?: () => void
  className?: string
  children?: React.ReactNode
}

export function InspectorPanel({
  selection,
  title,
  meta,
  batchNote,
  empty,
  readOnly,
  foot,
  onClose,
  className,
  children,
}: InspectorPanelProps) {
  return (
    <aside
      data-slot="inspector-panel"
      data-selection={selection}
      aria-label="Inspector"
      className={cn(
        'flex max-h-full w-[320px] min-w-0 flex-col overflow-hidden rounded-[14px] border border-transparent text-sm',
        className,
      )}
    >
      <header className="flex items-start gap-2 px-3.5 pb-2 pt-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[13px] font-semibold text-foreground">
            {selection === 'none' ? 'Inspector' : title}
          </span>
          {meta && selection !== 'none' ? (
            <span className="truncate font-mono text-[11px] text-muted-foreground">{meta}</span>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            title="Close inspector · ⌘I"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_13%,transparent)] hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </header>
      {selection === 'none' ? (
        <div className="px-3.5 pb-4 text-[12px] leading-relaxed text-muted-foreground">
          {empty ?? 'Select a row to edit it here.'}
        </div>
      ) : (
        <>
          {readOnly ? (
            <div
              role="note"
              className="mx-3.5 mb-2 flex flex-col gap-2 rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 py-2 text-[12px] text-[var(--sk-soft,var(--foreground))]"
            >
              <span>{readOnly.reason}</span>
              {readOnly.exits ? <span className="flex flex-wrap gap-1.5">{readOnly.exits}</span> : null}
            </div>
          ) : null}
          {selection === 'multi' && batchNote ? (
            <div className="px-3.5 pb-2 text-[12px] text-muted-foreground">{batchNote}</div>
          ) : null}
          <div
            data-slot="inspector-fields"
            aria-disabled={readOnly ? true : undefined}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-3"
          >
            {children}
          </div>
        </>
      )}
      {foot && selection !== 'none' ? (
        <footer className="border-t border-[var(--table-rule)] px-3.5 py-2 text-[11px] text-muted-foreground">
          {foot}
        </footer>
      ) : null}
    </aside>
  )
}

/** One labelled field in the inspector: label above, control below. */
export function InspectorField({
  label,
  hint,
  className,
  children,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <label data-slot="inspector-field" className={cn('flex flex-col gap-1', className)}>
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  )
}
