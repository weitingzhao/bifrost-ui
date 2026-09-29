import type { ShellNavGroup, ShellNavItem } from './types'

/**
 * The sidebar filter's index (Trade design 2026-09-28, "Filter pages"): every
 * page the tree can reach — including the children of a folded row, which the
 * DOM does not hold — each with the place it lives, so a result teaches the
 * tree instead of replacing it (`Research › Discover › Stock ratings`).
 */
export type ShellNavFilterEntry = {
  id: string
  label: string
  /** Where it lives, outermost first: `Group › Caption › Parent`. */
  place: string
  to?: string
  href?: string
  /** The row itself, when it came from the tree — handed back to `onSelect`. */
  item?: ShellNavItem
}

const target = (e: Pick<ShellNavFilterEntry, 'to' | 'href' | 'id'>) => e.to ?? e.href ?? e.id

/**
 * Walk the tree into a flat index. Captions name what follows them; a row with
 * children is a place for them as well as (when it has an address) a page of
 * its own. The first place a page is met wins, so a pin shelf listed after the
 * layers never becomes a page's home. `extra` adds pages the tree has no row
 * for (equipment on a toolbar), placed after the tree's own.
 */
export function shellNavFilterIndex(
  groups: readonly ShellNavGroup[],
  extra: readonly ShellNavFilterEntry[] = [],
): ShellNavFilterEntry[] {
  const out: ShellNavFilterEntry[] = []
  const seen = new Set<string>()
  const add = (e: ShellNavFilterEntry) => {
    const t = target(e)
    if (!t || seen.has(t)) return
    seen.add(t)
    out.push(e)
  }
  const walk = (items: readonly ShellNavItem[] | undefined, place: string) => {
    let caption = ''
    for (const it of items ?? []) {
      if (it.kind === 'caption') {
        caption = it.label
        continue
      }
      const here = caption ? `${place} › ${caption}` : place
      const isFold = (it.children?.length ?? 0) > 0 && it.id.startsWith('fold:')
      if (!isFold && !it.external) add({ id: it.id, label: it.label, place: here, to: it.to, href: it.href, item: it })
      if (it.children?.length) walk(it.children, `${here} › ${it.label}`)
    }
  }
  for (const g of groups) {
    if (g.to) add({ id: g.to, label: g.label, place: 'Menu', to: g.to })
    walk(g.items, g.label)
    for (const sg of g.subGroups ?? []) walk(sg.items, `${g.label} › ${sg.label}`)
  }
  for (const e of extra) add(e)
  return out
}

/**
 * Rank the index against what was typed: a label that starts with it, then
 * one that contains it, then a place that does, then an address. Nothing that
 * matches none of the four is shown.
 */
export function shellNavFilterMatch(
  index: readonly ShellNavFilterEntry[],
  query: string,
  limit = 40,
): ShellNavFilterEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const score = (e: ShellNavFilterEntry) => {
    const l = e.label.toLowerCase()
    if (l.startsWith(q)) return 0
    if (l.includes(q)) return 1
    if (e.place.toLowerCase().includes(q)) return 2
    if (target(e).toLowerCase().includes(q)) return 3
    return 9
  }
  return index
    .map((e, i) => [score(e), i, e] as const)
    .filter(([s]) => s < 9)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .slice(0, limit)
    .map(([, , e]) => e)
}
