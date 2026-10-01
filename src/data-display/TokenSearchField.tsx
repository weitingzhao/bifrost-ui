/**
 * TokenSearchField (Trade design Rev .132 §17.5): search as tokens. Typing
 * offers suggestions (Symbol · Structure · Account · Contains …); ↩ turns the
 * highlighted one into a token. The caller decides what the tokens mean —
 * usually a union within a kind and an intersection across kinds.
 *
 * Keys: ↑↓ move · ↩ take · ⌫ on an empty query drops the last token · esc
 * clears the text, then leaves the field. The field is itself glass (radius
 * 999 + rim); the suggestions grow down out of its lower edge.
 */
import * as React from 'react'
import { Search, X } from 'lucide-react'

import { cn } from '../lib/cn'

export interface SearchToken {
  /** The kind, e.g. "sym" · "structure" · "contains". */
  kind: string
  value: string
  /** What the chip shows before the value, e.g. "Symbol". */
  kindLabel?: string
}

export interface TokenSuggestion extends SearchToken {
  /** The suggestion's line; the value when absent. */
  label?: string
  /** A count or a hint on the right. */
  hint?: string
}

export interface TokenSearchFieldProps {
  tokens: readonly SearchToken[]
  onChange: (tokens: SearchToken[]) => void
  /** Suggestions for the typed text; empty hides the list. */
  suggest: (q: string) => readonly TokenSuggestion[]
  placeholder?: string
  /** Placeholder once a token is in. */
  placeholderMore?: string
  /** A chip's look per kind (e.g. the ticker ink for symbols). */
  tokenClassName?: (t: SearchToken) => string | undefined
  className?: string
  inputRef?: React.Ref<HTMLInputElement>
  'aria-label'?: string
}

function same(a: SearchToken, b: SearchToken) {
  return a.kind === b.kind && a.value === b.value
}

export function TokenSearchField({
  tokens,
  onChange,
  suggest,
  placeholder = 'Search',
  placeholderMore = 'Add filter',
  tokenClassName,
  className,
  inputRef,
  'aria-label': ariaLabel = 'Search',
}: TokenSearchFieldProps) {
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [idx, setIdx] = React.useState(0)
  const listId = React.useId()
  const list = React.useMemo(() => (q.trim() ? suggest(q.trim()) : []), [q, suggest])
  const shown = open && list.length > 0
  const take = (t: SearchToken) => {
    if (!tokens.some((x) => same(x, t))) onChange([...tokens, { kind: t.kind, value: t.value, kindLabel: t.kindLabel }])
    setQ('')
    setIdx(0)
    setOpen(false)
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!list.length) return
      e.preventDefault()
      setOpen(true)
      setIdx((i) => (i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length)
    } else if (e.key === 'Enter') {
      if (shown) {
        e.preventDefault()
        take(list[Math.min(idx, list.length - 1)])
      }
    } else if (e.key === 'Backspace') {
      if (!q && tokens.length) {
        e.preventDefault()
        onChange(tokens.slice(0, -1))
      }
    } else if (e.key === 'Escape') {
      if (q) {
        e.preventDefault()
        e.stopPropagation()
        setQ('')
        setOpen(false)
      } else {
        e.currentTarget.blur()
      }
    }
  }
  return (
    <div className={cn('relative min-w-0', className)}>
      <div
        data-slot="token-search"
        className="flex h-7 min-w-0 items-center gap-1 rounded-full border border-transparent pl-2.5 pr-1.5 text-[12px]"
      >
        <Search aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
        {tokens.map((t, i) => (
          <span
            key={`${t.kind}:${t.value}`}
            data-slot="search-token"
            className={cn(
              'inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--foreground)_11%,transparent)] pl-2 pr-1 text-[11px]',
              tokenClassName?.(t),
            )}
          >
            {t.kindLabel ? <span className="opacity-70">{t.kindLabel}</span> : null}
            <span className="font-medium">{t.value}</span>
            <button
              type="button"
              aria-label={`Remove ${t.kindLabel ?? t.kind} ${t.value}`}
              onClick={() => onChange(tokens.filter((_, j) => j !== i))}
              className="inline-flex size-4 items-center justify-center rounded-full opacity-70 hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setIdx(0)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder={tokens.length ? placeholderMore : placeholder}
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-full min-w-[4rem] flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {shown ? (
        <div
          id={listId}
          role="listbox"
          data-slot="token-suggest"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 flex flex-col gap-px overflow-hidden rounded-[11px] border border-transparent p-[5px] text-[12px]"
        >
          {list.map((s, i) => (
            <div
              key={`${s.kind}:${s.value}`}
              role="option"
              aria-selected={i === idx}
              onMouseDown={(e) => {
                e.preventDefault()
                take(s)
              }}
              onMouseEnter={() => setIdx(i)}
              className={cn(
                'flex cursor-default items-center gap-2 rounded-[6px] px-2 py-1',
                i === idx && 'bg-[color-mix(in_srgb,var(--sk-accent,var(--ring))_85%,transparent)] text-[var(--sk-on-accent,var(--primary-foreground))]',
              )}
            >
              {s.kindLabel ? <span className="w-16 shrink-0 text-[11px] opacity-70">{s.kindLabel}</span> : null}
              <span className="min-w-0 flex-1 truncate">{s.label ?? s.value}</span>
              {s.hint ? <span className="shrink-0 font-mono text-[11px] opacity-70">{s.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
