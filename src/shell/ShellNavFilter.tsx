import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn'
import type { ShellNavGroup, ShellNavItem } from './types'
import { shellNavFilterIndex, shellNavFilterMatch, type ShellNavFilterEntry } from './shellNavFilterModel'

export type ShellNavFilterOptions = {
  /** Pages the tree has no row for — equipment on a toolbar — with the place they live. */
  extra?: ShellNavFilterEntry[]
  placeholder?: string
  /** Said under "No page matches" — where else to look (e.g. the command palette). */
  elsewhere?: string
}

const editable = (el: Element | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/**
 * The field under the product mark (Trade design 2026-09-28, Owner: "finding
 * the menu I want takes time"). Typing swaps the tree for a flat list of the
 * pages that match, each with where it lives; `/` focuses, ↑ ↓ move, Enter
 * opens, Esc clears and then leaves. The results render where the tree does —
 * the sidebar passes `query` down and draws `ShellNavFilterResults` in place.
 */
export function ShellNavFilterField({
  query,
  onQuery,
  onKey,
  placeholder = 'Filter pages',
}: {
  query: string
  onQuery: (q: string) => void
  onKey: (e: KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onDoc = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || editable(document.activeElement)) return
      if (!ref.current || ref.current.offsetParent == null) return
      e.preventDefault()
      ref.current.focus()
      ref.current.select()
    }
    document.addEventListener('keydown', onDoc)
    return () => document.removeEventListener('keydown', onDoc)
  }, [])
  return (
    <div className="shrink-0 px-2 pt-0.5 pb-1.5">
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-[var(--sk-mute,var(--muted-foreground))]">
          ⌕
        </span>
        <input
          ref={ref}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              if (query) {
                onQuery('')
                e.stopPropagation()
              } else e.currentTarget.blur()
              return
            }
            onKey(e)
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="h-7 w-full rounded-[var(--control-radius,8px)] border-0 bg-[var(--field-fill)] pr-7 pl-6.5 text-xs text-foreground outline-none transition-shadow placeholder:text-[var(--sk-mute,var(--muted-foreground))] focus:shadow-[0_0_0_3px_var(--focus-glow)] [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? null : (
          <kbd className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 rounded bg-[var(--control-fill)] px-1 font-mono text-[10px] text-[var(--sk-mute,var(--muted-foreground))]">
            /
          </kbd>
        )}
      </div>
    </div>
  )
}

export function ShellNavFilterResults({
  hits,
  query,
  active,
  onHover,
  onPick,
  elsewhere,
}: {
  hits: ShellNavFilterEntry[]
  query: string
  active: number
  onHover: (i: number) => void
  onPick: (e: ShellNavFilterEntry) => void
  elsewhere?: string
}) {
  const q = query.trim().toLowerCase()
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])
  if (hits.length === 0) {
    return (
      <p className="m-0 px-3 py-2.5 text-xs leading-relaxed text-[var(--sk-mute,var(--muted-foreground))]">
        No page matches “{query.trim()}”.{elsewhere ? ` ${elsewhere}` : ''}
      </p>
    )
  }
  return (
    <div ref={listRef} role="listbox" aria-label="Pages matching the filter" className="flex flex-col gap-px px-2 pt-0.5 pb-2">
      {hits.map((h, i) => {
        const k = h.label.toLowerCase().indexOf(q)
        return (
          <button
            key={`${h.id}|${h.to ?? h.href ?? ''}`}
            type="button"
            role="option"
            aria-selected={i === active}
            data-i={i}
            onMouseEnter={() => onHover(i)}
            onClick={() => onPick(h)}
            className={cn(
              'flex w-full cursor-pointer flex-col items-start gap-px rounded-lg border-0 bg-transparent px-2 py-1.25 text-left',
              i === active && 'bg-[var(--control-fill)]',
            )}
          >
            <span className="text-[13px] leading-snug text-foreground">
              {k >= 0 ? (
                <>
                  {h.label.slice(0, k)}
                  <b className="font-semibold text-[var(--sk-accent,var(--primary))]">{h.label.slice(k, k + q.length)}</b>
                  {h.label.slice(k + q.length)}
                </>
              ) : (
                h.label
              )}
            </span>
            <span className="text-[10px] leading-tight text-[var(--sk-mute,var(--muted-foreground))]">{h.place}</span>
          </button>
        )
      })}
    </div>
  )
}

/** The filter's state for a sidebar: the query, what it matches, the key handling. */
export function useShellNavFilter(
  groups: readonly ShellNavGroup[],
  options: ShellNavFilterOptions | undefined,
  onSelect: (item: ShellNavItem) => void,
) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const index = useMemo(() => shellNavFilterIndex(groups, options?.extra), [groups, options?.extra])
  const hits = useMemo(() => shellNavFilterMatch(index, query), [index, query])
  const pick = (e: ShellNavFilterEntry) => {
    onSelect(e.item ?? { id: e.id, label: e.label, to: e.to, href: e.href })
    setQuery('')
  }
  const onQuery = (q: string) => {
    setQuery(q)
    setActive(0)
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!hits.length) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(hits[Math.min(active, hits.length - 1)])
    }
  }
  return { query, onQuery, onKey, hits, active, setActive, pick, filtering: query.trim().length > 0 }
}
