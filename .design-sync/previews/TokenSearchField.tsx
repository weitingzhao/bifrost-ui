import { TokenSearchField, type SearchToken, type TokenSuggestion } from '@bifrost/ui'
import { useCallback, useEffect, useRef, useState } from 'react'

const CATALOG: TokenSuggestion[] = [
  { kind: 'sym', kindLabel: 'Symbol', value: 'NVDA', label: 'NVDA · NVIDIA', hint: '6 plans' },
  { kind: 'sym', kindLabel: 'Symbol', value: 'NFLX', label: 'NFLX · Netflix', hint: '1 plan' },
  { kind: 'structure', kindLabel: 'Structure', value: 'Short put', hint: '9' },
  { kind: 'account', kindLabel: 'Account', value: 'U1234567', hint: 'margin' },
  { kind: 'contains', kindLabel: 'Contains', value: 'n', label: 'Text contains "n"' },
]

function useSuggest() {
  return useCallback((q: string) => {
    const s = q.toLowerCase()
    return CATALOG.filter((c) => c.kind === 'contains' || (c.label ?? c.value).toLowerCase().includes(s)).map((c) =>
      c.kind === 'contains' ? { ...c, value: q, label: `Text contains "${q}"` } : c,
    )
  }, [])
}

function Ground({ children }: { children: React.ReactNode }) {
  return <div className="h-64 rounded-lg bg-background p-4 text-foreground">{children}</div>
}

/** Tokens are the filter: a union within a kind, an intersection across kinds
    (the caller decides). Each chip shows its kind label and removes on ×;
    `tokenClassName` gives one kind its own ink. */
export const WithTokens = () => {
  const [tokens, setTokens] = useState<SearchToken[]>([
    { kind: 'sym', kindLabel: 'Symbol', value: 'NVDA' },
    { kind: 'structure', kindLabel: 'Structure', value: 'Short put' },
  ])
  const suggest = useSuggest()
  return (
    <Ground>
      <TokenSearchField
        tokens={tokens}
        onChange={setTokens}
        suggest={suggest}
        placeholder="Search plans"
        tokenClassName={(t) => (t.kind === 'sym' ? 'font-mono' : undefined)}
        className="w-96"
      />
    </Ground>
  )
}

/** Typing opens the suggestions, growing down out of the field's lower edge.
    ↑↓ move · ↩ turns the highlighted one into a token · ⌫ on an empty query
    drops the last token · esc clears the text, then leaves the field.
    (This card types "n" on mount so the list is visible in a still capture.) */
export const Suggesting = () => {
  const [tokens, setTokens] = useState<SearchToken[]>([{ kind: 'account', kindLabel: 'Account', value: 'U1234567' }])
  const suggest = useSuggest()
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    set?.call(el, 'n')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, [])
  return (
    <Ground>
      <TokenSearchField tokens={tokens} onChange={setTokens} suggest={suggest} inputRef={ref} className="w-96" />
    </Ground>
  )
}

/** Empty: the field is a glass capsule with a placeholder; `placeholderMore`
    replaces it once a token is in. */
export const Empty = () => {
  const [tokens, setTokens] = useState<SearchToken[]>([])
  const suggest = useSuggest()
  return (
    <Ground>
      <TokenSearchField tokens={tokens} onChange={setTokens} suggest={suggest} placeholder="Search plans" className="w-96" />
    </Ground>
  )
}
