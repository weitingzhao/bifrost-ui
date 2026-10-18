import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { foldTierOf } from '../adaptive/layout'
import { useLayoutProvided } from '../adaptive/LayoutProvider'
import { CollapsibleChevron } from '../data-display/CollapsibleGroup'
import { cn } from '../lib/cn'

/**
 * A page section's band (Trade design Rev .117, DESIGN_CONTRACTS §17.8).
 *
 * Three tiers only: Band (a page section) · Panel (a group surface, never
 * folds) · Group (inside a list — `CollapsibleGroup`). Every band folds; it is
 * open by default and its fold is remembered per page.
 *
 * The band is the header row alone. Its body is every sibling after it up to
 * the next band — the registry's `data-sr-band` rule — so a page keeps its
 * flat layout and a band is added by placing one header, not by re-nesting
 * the section. Folding marks those siblings `data-sr-band-hid` (hidden by
 * `styles/patterns`); a sibling rendered later is caught by an observer.
 *
 * The whole row toggles; a button, link or field inside it never does.
 * Enter / Space toggle, `aria-expanded` says the state, and the chevron is
 * `CollapsibleChevron`'s: down = folded, up = open. Under reduced motion it
 * does not animate.
 */
export interface SectionBandProps {
  /** Unique on the page: the key the fold is remembered under. */
  id: string
  title: ReactNode
  /** A reading beside the title; with `summaryWhenFolded` it shows only while folded. */
  summary?: ReactNode
  summaryWhenFolded?: boolean
  /** A count or scope at the rule's end. */
  meta?: ReactNode
  /** Controls at the row's end; clicking them never folds the band. */
  actions?: ReactNode
  defaultOpen?: boolean
  /**
   * Controlled: the page owns the fold (a reading elsewhere can open the band
   * to show what it points at). The page then remembers it, not the band.
   */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The page the fold is remembered for; the pathname by default. */
  persistKey?: string
  /** The band's explanation, on hover. */
  note?: string
  /** An anchor id on the heading, for `#hash` links into the section. */
  headingId?: string
  /**
   * Under a `LayoutProvider` (0.15.0, Trade design Rev .174 B10 · §18.7 ·
   * §18.11): fold by default on these classes — reference sections a phone or
   * a short screen should not spend its first screen on. `compact` and
   * `short` (short off compact) each remember their own fold, under
   * `<page>@compact` · `<page>@short`; neither is carried to the desk. No
   * provider: ignored.
   */
  foldAt?: readonly ('compact' | 'short')[]
  className?: string
}

const STORE = 'bifrost.band'
const HID = 'data-sr-band-hid'

function pageKey(persistKey: string | undefined): string {
  if (persistKey) return persistKey
  return typeof window === 'undefined' ? '' : window.location.pathname
}

function readFold(page: string, id: string): boolean | null {
  try {
    const all = JSON.parse(window.localStorage.getItem(STORE) || '{}') as Record<string, Record<string, number>>
    const v = all[page]?.[id]
    return v === 0 ? false : v === 1 ? true : null
  } catch {
    return null
  }
}

function writeFold(page: string, id: string, open: boolean, defaultOpen: boolean): void {
  try {
    const all = JSON.parse(window.localStorage.getItem(STORE) || '{}') as Record<string, Record<string, number>>
    const m = all[page] ?? (all[page] = {})
    // Only the departure from the default is kept, so the store holds the folds and nothing else.
    if (open === defaultOpen) delete m[id]
    else m[id] = open ? 1 : 0
    if (Object.keys(m).length === 0) delete all[page]
    window.localStorage.setItem(STORE, JSON.stringify(all))
  } catch {
    /* storage unavailable: the fold lasts the visit */
  }
}

const isBand = (el: Element) => el.hasAttribute('data-sr-band')

export function SectionBand({
  id,
  title,
  summary,
  summaryWhenFolded = false,
  meta,
  actions,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  persistKey,
  note,
  headingId,
  foldAt,
  className,
}: SectionBandProps) {
  const layout = useLayoutProvided()
  const tier = layout != null && foldAt != null ? foldTierOf(layout) : null
  const base = pageKey(persistKey)
  const page = tier ? `${base}@${tier}` : base
  const tierDefault = tier != null && foldAt?.includes(tier) ? false : defaultOpen
  const [openState, setOpen] = useState(() => readFold(page, id) ?? tierDefault)
  // Crossing into another class reads that class's own memory and default.
  const [memory, setMemory] = useState(page)
  if (memory !== page) {
    setMemory(page)
    setOpen(readFold(page, id) ?? tierDefault)
  }
  const controlled = openProp !== undefined
  const open = controlled ? openProp : openState
  const ref = useRef<HTMLDivElement>(null)

  // The body is the run of siblings up to the next band.
  useLayoutEffect(() => {
    const head = ref.current
    const parent = head?.parentElement
    if (!head || !parent) return
    const apply = () => {
      for (let n = head.nextElementSibling; n && !isBand(n); n = n.nextElementSibling) {
        if (open) n.removeAttribute(HID)
        else if (!n.hasAttribute(HID)) n.setAttribute(HID, '')
      }
    }
    apply()
    const mo = new MutationObserver(apply)
    mo.observe(parent, { childList: true })
    return () => {
      mo.disconnect()
      for (let n = head.nextElementSibling; n && !isBand(n); n = n.nextElementSibling) n.removeAttribute(HID)
    }
  }, [open])

  const toggle = useCallback(() => {
    if (controlled) {
      onOpenChange?.(!open)
      return
    }
    setOpen((v) => {
      writeFold(page, id, !v, tierDefault)
      onOpenChange?.(!v)
      return !v
    })
  }, [controlled, open, onOpenChange, page, id, tierDefault])

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const hit = (e.target as Element).closest('button, a, input, select, textarea, label, [data-sr-band-keep]')
    if (hit && e.currentTarget.contains(hit)) return
    toggle()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    toggle()
  }

  return (
    <div
      ref={ref}
      data-sr-band={id}
      data-open={open ? '1' : '0'}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      title={note}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        'group/band flex min-w-0 cursor-pointer select-none items-center gap-2 rounded-md pt-1.5 outline-none',
        'focus-visible:shadow-[0_0_0_2px_color-mix(in_srgb,var(--sk-accent,#a78bfa)_45%,transparent)]',
        className,
      )}
    >
      <CollapsibleChevron
        expanded={open}
        className="size-3 text-[var(--sk-mute,#7a8492)] duration-[var(--mo-fast,150ms)] ease-[var(--mo-ease-out,ease-out)] group-hover/band:text-[var(--sk-ink,#e4e9ef)] group-focus-visible/band:text-[var(--sk-ink,#e4e9ef)] motion-reduce:transition-none"
      />
      <h2
        id={headingId}
        className="m-0 min-w-0 text-[15px] font-semibold tracking-[-0.005em] text-pretty text-[var(--sk-ink,#e6e9f2)]"
      >
        {title}
      </h2>
      {summary != null && (!summaryWhenFolded || !open) ? (
        <span className="min-w-0 truncate font-mono text-[11px] tabular-nums text-[var(--sk-mute2,#98a2b0)]">{summary}</span>
      ) : null}
      <span aria-hidden className="h-px min-w-6 flex-[1_1_24px] bg-[var(--sk-line0,var(--sk-line,#1f2330))]" />
      {meta != null ? (
        <span data-sr-band-meta="" className="min-w-0 truncate text-[11px] text-[var(--sk-mute,#7a8492)]">
          {meta}
        </span>
      ) : null}
      {actions != null ? <span className="inline-flex shrink-0 items-center gap-1.5">{actions}</span> : null}
    </div>
  )
}
