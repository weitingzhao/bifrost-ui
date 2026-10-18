/**
 * The compact tab bar (Trade design Rev .174 B4, DESIGN_CONTRACTS §18.4): five
 * cells, a 24px icon over a 10px label, float glass with an ink 8% top edge,
 * the current cell in the view's one accent (`--sk-accent`). `--tab-bar-h`
 * (49) high plus the bottom safe area. Pressing the current cell again on its
 * root page scrolls the page back to the top.
 *
 * Which five targets, and what More opens, belong to the app. Under a
 * `LayoutProvider` the bar draws only on compact; without one it draws
 * wherever it is mounted. While it is up, `<html data-tab-bar>` lets floats
 * that sit at the bottom (a compact popover, a toast) clear it. The look is in
 * `@bifrost/ui/styles/layout`.
 */
import * as React from 'react'

import { useLayoutProvided } from '../adaptive/LayoutProvider'

export interface TabBarItem {
  id: string
  label: string
  /** A 24px glyph (an svg, a lucide icon element). */
  icon: React.ReactNode
}

export interface TabBarProps {
  items: readonly TabBarItem[]
  /** The cell that stands current; null for none. */
  current: string | null
  onSelect: (id: string) => void
  /**
   * The page is the current cell's own root: pressing that cell again scrolls
   * to the top instead of calling `onSelect`. Default true.
   */
  atRoot?: boolean
  /** What "back to the top" scrolls; the page lane (`[data-sr-lane]`), else `main`. */
  onTop?: () => void
  /** The bar's accessible name. */
  label?: string
  className?: string
}

function scrollLaneTop(): void {
  const lane = document.querySelector('[data-sr-lane]') ?? document.querySelector('main')
  lane?.scrollTo?.({ top: 0, behavior: 'smooth' })
}

export function TabBar({ items, current, onSelect, atRoot = true, onTop, label = 'Sections', className }: TabBarProps) {
  const layout = useLayoutProvided()
  const shown = layout == null || layout.w === 'compact'

  React.useLayoutEffect(() => {
    if (!shown) return
    const root = document.documentElement
    root.setAttribute('data-tab-bar', '1')
    return () => root.removeAttribute('data-tab-bar')
  }, [shown])

  if (!shown) return null
  return (
    <nav data-slot="tab-bar" aria-label={label} className={className}>
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          data-slot="tab-bar-item"
          aria-label={t.label}
          aria-current={t.id === current ? 'page' : undefined}
          onClick={() => {
            if (t.id === current && atRoot) {
              if (onTop) onTop()
              else scrollLaneTop()
              return
            }
            onSelect(t.id)
          }}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
