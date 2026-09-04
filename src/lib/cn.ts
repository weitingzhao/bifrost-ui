import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The dense type scale, declared to tailwind-merge as font sizes.
 *
 * Without this, plain `twMerge` reads `text-dense-micro` as a *text colour* —
 * it cannot know otherwise — and drops any colour set earlier in the same
 * class list. `<Button className="text-dense-micro">` therefore kept
 * `bg-primary` and silently lost `text-primary-foreground`, so the label fell
 * back to the inherited body colour: near-white on the lime accent, measured at
 * 1.24:1 where AA wants 4.5:1. Six primary actions across the Loop and Decision
 * surfaces were effectively unreadable, including "Approve all".
 *
 * Fixing it here rather than at the call sites is deliberate: the collision is
 * a property of the scale, so any future `text-dense-*` on a filled control
 * would reintroduce it one component at a time.
 */
const DENSE_FONT_SIZES = [
  'dense-micro',
  'dense-caption',
  'dense-meta',
  'dense-label',
  'dense-body',
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...DENSE_FONT_SIZES] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
