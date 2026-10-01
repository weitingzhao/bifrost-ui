/**
 * UndoToast (Trade design Rev .132 §17.5): delete without asking, then offer
 * the way back. A capsule at the bottom centre — the message, one action
 * (Undo, or Show when a new object is hidden by the filter) and the ⌘Z hint —
 * that closes itself after 5s. `role="status"`, so it is read out.
 *
 * The page's undo stack is the source of truth; ⌘Z and this button call the
 * same undo. With `hotkey` (default on) the toast binds ⌘Z / Ctrl+Z while it
 * is up, outside text fields.
 */
import * as React from 'react'

import { cn } from '../lib/cn'

export interface UndoToastProps {
  open: boolean
  message: React.ReactNode
  /** "Undo" by default; "Show" for a new object hidden by the filter. */
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
  /** ms; 5000 by default. */
  duration?: number
  /** Bind ⌘Z to onAction while open (default true). Off when the page binds ⌘Z itself. */
  hotkey?: boolean
  /** Show the ⌘Z hint (default: when the action is Undo). */
  showHint?: boolean
  className?: string
}

function typing(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  return !!el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable)
}

export function UndoToast({
  open,
  message,
  actionLabel = 'Undo',
  onAction,
  onClose,
  duration = 5000,
  hotkey = true,
  showHint,
  className,
}: UndoToastProps) {
  const close = React.useRef(onClose)
  close.current = onClose
  const act = React.useRef(onAction)
  act.current = onAction
  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => close.current(), duration)
    return () => clearTimeout(t)
  }, [open, duration, message])
  React.useEffect(() => {
    if (!open || !hotkey || !act.current) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !typing(e.target)) {
        e.preventDefault()
        act.current?.()
        close.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hotkey])
  if (!open) return null
  const hint = showHint ?? actionLabel === 'Undo'
  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="undo-toast"
      className={cn(
        'fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border border-transparent py-1.5 pl-4 pr-1.5 text-[13px] text-foreground',
        className,
      )}
    >
      <span className="min-w-0 truncate">{message}</span>
      {onAction ? (
        <button
          type="button"
          onClick={() => {
            onAction()
            onClose()
          }}
          className="inline-flex h-7 items-center gap-2 rounded-full px-3 font-medium text-[var(--sk-accent,var(--primary))] hover:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]"
        >
          {actionLabel}
          {hint ? <kbd className="font-sans text-[11px] text-muted-foreground">⌘Z</kbd> : null}
        </button>
      ) : null}
    </div>
  )
}
