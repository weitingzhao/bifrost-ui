/**
 * Wide tables on compact (Trade design Rev .174 B6, DESIGN_CONTRACTS §18.6):
 * a table keeps 2–3 columns and a row opens the rest in a sheet.
 *
 * - `keepRule(value)` — the CSS for one `data-sr-keep="1,4,8"` value: on
 *   compact every other cell hides. A full-width cell (`colspan`) keeps
 *   spanning, and a table nested in a cell keeps all its columns. CSS cannot
 *   read a list out of an attribute, so each value's rule is written once, the
 *   first time it is seen (`ensureKeepRule`).
 * - `RowDetailSheet` — the row's sheet: the first cell is the title, every other
 *   column a "header · cell" line. The cells are clones that look like the
 *   originals and whose controls click the originals in the table; a row that
 *   opens something gets `Open` in the foot.
 *
 * `DenseDataTable compactKeep` uses both, and only under a `LayoutProvider`.
 */
import * as React from 'react'

import { BottomSheet } from './BottomSheet'

/** What counts as a control inside a row: a click on one is the control's, not the row's. */
export const ROW_CONTROLS =
  'button, a[href], input, select, textarea, label, [role="button"], [role="checkbox"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"], summary'

const PASS = new WeakSet<Element>()

/** Whether a click is one this layer re-sent itself (and must let through). */
export function isPassed(el: Element): boolean {
  return PASS.has(el)
}

/** Re-dispatch a click that was intercepted, without intercepting it a second time. */
export function passClick(el: HTMLElement): void {
  PASS.add(el)
  try {
    el.click()
  } finally {
    PASS.delete(el)
  }
}

export function keepValue(cols: readonly number[]): string {
  return cols.filter((n) => Number.isInteger(n) && n > 0).join(',')
}

export function keepRule(value: string): string {
  const keep = value
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => n > 0)
  if (keep.length === 0) return ''
  const nots = keep.map((n) => `:not(:nth-child(${n}))`).join('')
  const host = `[data-sr-keep="${value.replace(/["\\]/g, '')}"]`
  return `html[data-w="compact"] ${host} tr:not(${host} td tr) > :is(th, td)${nots}:not([colspan]) { display: none; }`
}

const STYLE_ID = 'bifrost-keep-css'
const written = new Set<string>()

export function ensureKeepRule(value: string): void {
  if (typeof document === 'undefined' || !value) return
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
    written.clear()
  }
  if (written.has(value)) return
  written.add(value)
  style.textContent = (style.textContent ?? '') + keepRule(value) + '\n'
}

/** Copy a cloned field's value onto the original and let its handlers hear it. */
function writeBack(original: HTMLElement, clone: HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement): void {
  if (original instanceof HTMLInputElement && clone instanceof HTMLInputElement && (clone.type === 'checkbox' || clone.type === 'radio')) {
    if (original.checked !== clone.checked) original.click()
    return
  }
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(original) as object, 'value')?.set
  if (setter) setter.call(original, clone.value)
  else (original as HTMLInputElement).value = clone.value
  original.dispatchEvent(new Event('input', { bubbles: true }))
  original.dispatchEvent(new Event('change', { bubbles: true }))
}

/** One table cell, cloned into the sheet: it looks like the cell, and its controls act on the originals. */
function RowCell({ td }: { td: Element }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    const host = ref.current
    if (!host) return
    // The original can change while the sheet is open (a reading that ticks): clone again when it does.
    const draw = () => {
      host.replaceChildren(...[...td.childNodes].map((n) => n.cloneNode(true)))
      host.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'))
      const fields = 'select, input, textarea'
      const live = [...td.querySelectorAll<HTMLInputElement>(fields)]
      host.querySelectorAll<HTMLInputElement>(fields).forEach((c, i) => {
        const o = live[i]
        if (!o) return
        if (c.type === 'checkbox' || c.type === 'radio') c.checked = o.checked
        else c.value = o.value
      })
      const originals = [...td.querySelectorAll<HTMLElement>(ROW_CONTROLS)]
      host.querySelectorAll<HTMLElement>(ROW_CONTROLS).forEach((n, i) => {
        const o = originals[i]
        if (n instanceof HTMLSelectElement || n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement) {
          n.addEventListener('change', () => {
            if (o && o.isConnected) writeBack(o, n)
          })
          return
        }
        n.addEventListener('click', (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          if (o && o.isConnected) passClick(o)
        })
      })
    }
    draw()
    const mo = new MutationObserver(draw)
    mo.observe(td, { subtree: true, childList: true, characterData: true, attributes: true })
    return () => mo.disconnect()
  }, [td])
  // A span: the title sits in the sheet's heading.
  return <span ref={ref} data-slot="row-detail-cell" />
}

function caption(th: Element | undefined): string {
  if (!th) return ''
  const t = (th as HTMLElement).innerText || th.textContent || ''
  return t.trim().split('\n')[0]
}

/** Whether a click on `target` inside `tr` should open the row's sheet. */
export function opensRowSheet(tr: HTMLTableRowElement, target: Element): boolean {
  if (PASS.has(tr)) return false
  if (tr.getAttribute('data-sr-row-detail') === 'page' || tr.hasAttribute('data-sr-detail')) return false
  if (tr.children.length === 1 && tr.firstElementChild?.hasAttribute('colspan')) return false
  // A control inside the row keeps its tap; a row that is itself a control
  // (role="button") is the row, not a control in it.
  const c = target.closest(ROW_CONTROLS)
  return !(c && c !== tr && tr.contains(c))
}

const hasText = (el: Element | undefined): boolean => el != null && (el.textContent ?? '').trim() !== ''

export function RowDetailSheet({ row, onClose }: { row: HTMLTableRowElement | null; onClose: () => void }) {
  const [shown, setShown] = React.useState<HTMLTableRowElement | null>(row)
  if (row && row !== shown) setShown(row)
  const tr = row ?? shown
  if (!tr) return null
  const table = tr.closest('table')
  const heads = table ? [...table.querySelectorAll('thead tr:first-child > th')] : []
  const cells = [...tr.children]
  // The title is the first cell; when it holds no words (a lamp, a mark) the
  // first cell with words joins it (§18.6, Rev .175) and leaves the lines.
  const lead = cells[0]
  const named = lead && !hasText(lead) ? cells.findIndex((td, i) => i > 0 && hasText(td)) : -1
  const titled = named > 0 ? [lead, cells[named]] : lead ? [lead] : []
  const lines = cells.slice(1).flatMap((td, j) => {
    const i = j + 1
    if (i === named) return []
    const k = caption(heads[i])
    const txt = (td.textContent ?? '').trim()
    return !k && !txt ? [] : [{ k: k || '—', td }]
  })
  const opens = tr.getAttribute('data-sr-open') || (getComputedStyle(tr).cursor === 'pointer' ? 'Open' : '')
  return (
    <BottomSheet
      open={row != null}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={
        titled.length === 0 ? null : titled.length === 1 ? (
          <RowCell td={titled[0]} />
        ) : (
          <span data-slot="row-detail-title">
            {titled.map((td, i) => (
              <RowCell key={i} td={td} />
            ))}
          </span>
        )
      }
      label={(titled[titled.length - 1]?.textContent ?? '').trim() || 'Row'}
      actions={opens ? [{ label: opens, primary: true, onRun: () => passClick(tr) }] : []}
    >
      <dl data-slot="row-detail">
        {lines.map((l, i) => (
          <div key={i} data-slot="row-detail-line">
            <dt>{l.k}</dt>
            <dd>
              <RowCell td={l.td} />
            </dd>
          </div>
        ))}
      </dl>
    </BottomSheet>
  )
}
