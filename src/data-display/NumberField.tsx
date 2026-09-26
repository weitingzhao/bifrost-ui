/**
 * A numeric field that steps (design Rev .72 B7). Focus it and a − ⋮ +
 * capsule sits at its right edge: press to step, hold to repeat, drag the
 * grip between them to scrub; ⇧ is ×10; ↑ ↓ step as well. The step is the
 * value's last decimal place, or `step`; a `$`, thousands commas and a `%`
 * are kept (`stepValue`).
 *
 * Controlled: `value` is the text as typed, `onValueChange` receives the next
 * text, whether typed or stepped.
 */
import * as React from 'react'
import { cn } from '../lib/cn'
import { Input } from '../ui/input'
import { NUMERIC, stepValue } from './numberStep'

export interface NumberFieldProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'step'> {
  value: string
  onValueChange: (next: string) => void
  /** The step, when it is not the value's own last decimal place. */
  step?: number | string
}

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ value, onValueChange, step, className, onFocus, onBlur, onKeyDown, disabled, readOnly, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)
    const latest = React.useRef(value)
    latest.current = value
    const stepAttr = step == null ? undefined : String(step)
    const move = React.useCallback(
      (n: number) => {
        const next = stepValue(latest.current, n, stepAttr)
        if (next != null) {
          latest.current = next
          onValueChange(next)
        }
      },
      [onValueChange, stepAttr],
    )

    // Press to step, hold to repeat (after 380ms, every 60ms).
    const press = (dir: 1 | -1) => (e: React.PointerEvent) => {
      e.preventDefault()
      const k = dir * (e.shiftKey ? 10 : 1)
      move(k)
      let t = window.setTimeout(function again() {
        move(k)
        t = window.setTimeout(again, 60)
      }, 380)
      const stop = () => {
        window.clearTimeout(t)
        window.removeEventListener('pointerup', stop)
      }
      window.addEventListener('pointerup', stop)
    }

    // Drag the grip: one step per 4px, ⇧ ×10.
    const scrub = (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault()
      const grip = e.currentTarget
      grip.setPointerCapture(e.pointerId)
      let lx = e.clientX
      const drag = (m: PointerEvent) => {
        const d = Math.trunc((m.clientX - lx) / 4)
        if (d) {
          move(d * (m.shiftKey ? 10 : 1))
          lx += d * 4
        }
      }
      const up = () => {
        grip.removeEventListener('pointermove', drag)
        grip.removeEventListener('pointerup', up)
      }
      grip.addEventListener('pointermove', drag)
      grip.addEventListener('pointerup', up)
    }

    const stepping = focused && !disabled && !readOnly && NUMERIC.test(value.trim())
    return (
      <span className="relative inline-flex w-full min-w-0 items-center">
        <Input
          ref={ref}
          inputMode="decimal"
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(stepping && 'pr-[66px]', className)}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (e.defaultPrevented || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
            e.preventDefault()
            move((e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1))
          }}
          {...props}
        />
        {stepping ? (
          <span
            data-slot="number-field-stepper"
            className="absolute right-1 flex h-5 items-center gap-px rounded-[7px] bg-[color-mix(in_srgb,var(--popover)_92%,transparent)] p-px shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--foreground)_12%,transparent),0_4px_12px_-4px_rgb(0_0_0/0.5)]"
            onPointerDown={(e) => e.preventDefault()}
          >
            <button
              type="button"
              tabIndex={-1}
              aria-label="Decrease"
              onPointerDown={press(-1)}
              className="size-[18px] rounded-[5px] font-mono text-xs leading-none text-muted-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)] hover:text-foreground"
            >
              −
            </button>
            <i
              aria-hidden
              onPointerDown={scrub}
              className="h-[18px] w-2 cursor-ew-resize touch-none rounded-[3px] bg-[repeating-linear-gradient(90deg,color-mix(in_srgb,var(--foreground)_20%,transparent)_0_1px,transparent_1px_3px)]"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label="Increase"
              onPointerDown={press(1)}
              className="size-[18px] rounded-[5px] font-mono text-xs leading-none text-muted-foreground hover:bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)] hover:text-foreground"
            >
              +
            </button>
          </span>
        ) : null}
      </span>
    )
  },
)
NumberField.displayName = 'NumberField'
