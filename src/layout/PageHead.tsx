import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/cn'

/**
 * The one page head (design `_Shell PageHead`, DESIGN_CONTRACTS §16.10).
 *
 * Row 1: title · ⓘ · stamp · meta · actions. Row 2 (optional): underline tabs.
 * It ends in one hairline, and it has two heights only — 43px without tabs,
 * 75px with them.
 *
 * - The page's description lives behind ⓘ — hover shows it, a click pins it,
 *   Escape or a click outside closes it. It is never on screen by default.
 * - `stamp` is the freshness slot. What goes in it (an as-of, a fetch instant,
 *   a revision, a confidence chip) is the app's business: this component
 *   only guarantees the slot never shrinks, so a stale or unwired reading is
 *   always visible (§16.3).
 * - Page filters and account scope do not belong here; they go in the
 *   toolbar under the head.
 * - When space runs out the meta truncates first, then the title (never past
 *   45% of the row).
 *
 * Deliberately separate from `PageHeader`, which prints its description on
 * screen and is still what the Ops Console uses.
 */

export interface PageHeadTab {
  value: string
  label: ReactNode
  title?: string
  /** A count beside the label (mono); `countClassName` colours it. */
  count?: ReactNode
  countClassName?: string
}

export interface PageHeadProps {
  title: string
  /** The page's description, behind ⓘ. */
  info?: ReactNode
  /** The freshness slot. */
  stamp?: ReactNode
  /** Counts, in mono. */
  meta?: ReactNode
  /** Page actions — `PageHeadAction` keeps them in the head's own style. */
  actions?: ReactNode
  tabs?: readonly PageHeadTab[]
  tab?: string
  onTab?: (value: string) => void
  /**
   * Whether the title is on screen, as it scrolls (§16.12). A shell uses it
   * to fold the breadcrumb's leaf while the page names itself.
   */
  onTitleVisible?: (visible: boolean) => void
  className?: string
}

export function PageHead({
  title,
  info,
  stamp,
  meta,
  actions,
  tabs,
  tab,
  onTab,
  onTitleVisible,
  className,
}: PageHeadProps) {
  const h1 = useRef<HTMLHeadingElement>(null)
  const report = useRef(onTitleVisible)
  report.current = onTitleVisible

  useEffect(() => {
    const el = h1.current
    if (!el) return
    report.current?.(true)
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1]
        if (e) report.current?.(e.isIntersecting)
      },
      { threshold: 0, rootMargin: '-8px 0px 0px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const hasTabs = tabs != null && tabs.length > 0
  return (
    <header
      data-pagehead=""
      className={cn(
        'flex min-w-0 flex-col border-b border-[var(--sk-line0,var(--border))] text-[var(--foreground)]',
        className,
      )}
    >
      {/* 36px of row plus the 6px under it: 43 with the hairline, 75 with tabs. */}
      <div className="flex min-h-[42px] min-w-0 items-center gap-2.5 pb-1.5">
        <h1
          ref={h1}
          title={title}
          className="m-0 min-w-0 max-w-[45%] flex-[0_1_auto] truncate text-[22px] font-bold leading-7 tracking-[-0.015em]"
        >
          {title}
        </h1>
        {info != null && info !== '' ? <PageHeadInfo>{info}</PageHeadInfo> : null}
        {stamp != null ? <span className="inline-flex flex-none items-center gap-2">{stamp}</span> : null}
        <span className="min-w-2 flex-[1_1_auto]" />
        {meta != null && meta !== '' ? (
          <span
            title={typeof meta === 'string' ? meta : undefined}
            className="min-w-0 flex-[0_1_auto] truncate whitespace-nowrap font-mono text-xs tabular-nums text-[var(--sk-soft,var(--muted-foreground))]"
          >
            {meta}
          </span>
        ) : null}
        {actions != null ? <div className="flex flex-none items-center gap-1.5">{actions}</div> : null}
      </div>
      {hasTabs ? (
        <nav
          role="tablist"
          className="-mb-px flex h-8 min-w-0 items-stretch gap-[18px] overflow-x-auto [scrollbar-width:none]"
        >
          {tabs.map((t) => {
            const active = t.value === tab
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={active}
                title={t.title}
                onClick={() => onTab?.(t.value)}
                className={cn(
                  'inline-flex flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap border-0 border-b-2 bg-transparent px-px text-[12.5px] font-semibold',
                  active
                    ? 'border-[var(--sk-accent,var(--primary))] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--sk-mute2,var(--muted-foreground))] hover:text-[var(--foreground)]',
                )}
              >
                <span>{t.label}</span>
                {t.count != null && t.count !== '' ? (
                  <span
                    className={cn(
                      'font-mono text-[10.5px] font-medium tabular-nums',
                      t.countClassName ?? 'text-[var(--sk-mute,var(--muted-foreground))]',
                    )}
                  >
                    {t.count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
      ) : null}
    </header>
  )
}

/** ⓘ: hover shows the page's description, a click pins it, Escape or a click outside closes it. */
function PageHeadInfo({ children }: { children: ReactNode }) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const wrap = useRef<HTMLSpanElement>(null)
  const open = hover || pinned

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (pinned && wrap.current && !wrap.current.contains(e.target as Node)) setPinned(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false)
        setHover(false)
      }
    }
    document.addEventListener('mousedown', away, true)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away, true)
      document.removeEventListener('keydown', esc)
    }
  }, [open, pinned])

  return (
    <span
      ref={wrap}
      className="relative inline-flex flex-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        aria-label="About this page"
        aria-expanded={open}
        onClick={() => setPinned((p) => !p)}
        className={cn(
          'inline-flex size-[18px] cursor-pointer items-center justify-center rounded-full border bg-transparent p-0 text-[11px] font-semibold leading-none',
          open
            ? 'border-[var(--sk-line2,var(--border))] text-[var(--foreground)]'
            : 'border-[var(--sk-line,var(--border))] text-[var(--sk-mute2,var(--muted-foreground))]',
        )}
      >
        i
      </button>
      {open ? (
        <div
          role="note"
          className="absolute left-[-8px] top-[26px] z-[60] w-[380px] max-w-[60vw] whitespace-normal rounded-lg border border-[var(--sk-line,var(--border))] bg-[var(--popover)] px-3 py-2.5 text-[12.5px] font-normal leading-[1.55] text-[var(--popover-foreground)] shadow-[0_10px_28px_rgb(0_0_0/0.35)] [text-wrap:pretty]"
        >
          {children}
        </div>
      ) : null}
    </span>
  )
}

export interface PageHeadActionProps {
  children: ReactNode
  onClick?: () => void
  title?: string
  /** The page's one main action; there is at most one (§16.10). */
  primary?: boolean
  disabled?: boolean
  /**
   * A state colour for the label and border (Refresh polling → done). An
   * action that carries one is announced politely, so the change is heard as
   * well as seen.
   */
  ink?: string
  border?: string
}

/** An action in the head's own register: small, outline unless it is the one primary. */
export function PageHeadAction({ children, onClick, title, primary, disabled, ink, border }: PageHeadActionProps) {
  const stateful = ink != null || border != null
  return (
    <Button
      type="button"
      variant={primary ? 'default' : 'outline'}
      size="sm"
      title={title}
      disabled={disabled}
      onClick={onClick}
      aria-live={stateful ? 'polite' : undefined}
      style={
        stateful
          ? { color: ink, borderColor: border, transition: 'color .15s ease, border-color .15s ease' }
          : undefined
      }
    >
      {children}
    </Button>
  )
}
