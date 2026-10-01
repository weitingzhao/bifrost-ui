/**
 * Morph (Trade design Rev .132 §16.6a): a surface grows out of what summoned
 * it and goes back in. Two kinds:
 *
 * - from an element (a trigger's ref): FLIP — the surface is held at
 *   `data-morph="pending"` until it and the trigger are both laid out, then
 *   `--morph-from` carries the trigger's box and `data-morph="rect"` runs the
 *   keyframes in `styles/materials.css`. Closing (Radix sets
 *   `data-state="closed"`) runs the same transform back in 200ms; Radix's
 *   Presence waits for that animation before unmounting.
 * - from a point (`"pointer"` for a context menu, `"arrow"` for a popover):
 *   the surface scales out of the transform origin Radix publishes.
 *
 * No source, or reduced motion, leaves the surface on its ordinary fade.
 */
import * as React from 'react'

export type MorphSource = React.RefObject<HTMLElement | null> | 'pointer' | 'arrow' | null | undefined

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Apply a morph to the element behind the returned ref. `originVar` names Radix's transform-origin variable. */
export function useMorph<T extends HTMLElement>(source: MorphSource, originVar?: string): React.RefObject<T | null> {
  const ref = React.useRef<T | null>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !source || reducedMotion()) return
    if (source === 'pointer' || source === 'arrow') {
      if (originVar) el.style.setProperty('--morph-origin', `var(${originVar})`)
      el.dataset.morph = 'point'
      return
    }
    const src = source.current
    if (!src) return
    el.dataset.morph = 'pending'
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        const f = el.getBoundingClientRect()
        const r = src.getBoundingClientRect()
        if (!f.width || !f.height || !r.width || !r.height) {
          delete el.dataset.morph
          return
        }
        el.style.setProperty(
          '--morph-from',
          `translate(${r.left - f.left}px, ${r.top - f.top}px) scale(${r.width / f.width}, ${r.height / f.height})`,
        )
        el.dataset.morph = 'rect'
      })
    })
    return () => cancelAnimationFrame(raf)
    // Measured once per mount: a Radix surface remounts every time it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return ref
}

/** One ref for several: a forwarded ref and the component's own. */
export function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (node) => {
    for (const r of refs) {
      if (typeof r === 'function') r(node)
      else if (r) (r as React.MutableRefObject<T | null>).current = node
    }
  }
}
