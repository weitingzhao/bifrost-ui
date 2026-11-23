import { hash, type Sprite } from '../kit'
import type { Light } from '../light'

/**
 * Dusk and night for the pictures drawn in daylight (building kinds, the district landmarks, the cars at a door):
 * one pass for all of them, not a second drawing of each (the Owner, 2026-11-19: the town has its time of day; the
 * same picture, its light changed). The whole picture is dimmed toward the night palette of light.ts (the generic
 * halls' WALLS, so a landmark beside a hall reads as the same night), then a share of its windows is lit on top.
 * Which windows are lit is fixed by the picture's seed, not by any reading: lit windows mean "night", nothing more,
 * as for the generic halls (sprites.ts litBy). Day: the picture as it is.
 */
const MATRIX: Record<Exclude<Light, 'day'>, string> = {
  // White #f6f4ef goes to about #4a4f72, the night walls' top.
  night: '0.30 0 0 0 0  0 0.31 0 0 0.01  0 0 0.40 0 0.06  0 0 0 1 0',
  // White goes to about #f7e6d6, the dusk walls' top.
  dusk: '1 0 0 0 0  0 0.94 0 0 0  0 0 0.86 0 0  0 0 0 1 0',
}
const LIT = { night: 0.72, dusk: 0.35 } as const
const LIT_FILL = '#ffd27a'

export function atLight(sp: Sprite, light: Light, seed = 0): Sprite {
  if (light === 'day') return sp
  const head = sp.svg.match(/^<svg[^>]*>/)![0]
  const inner = sp.svg.slice(head.length, -'</svg>'.length)
  const id = `lt-${light}`
  const lit = (sp.windows ?? []).filter((_, i) => (hash(`${seed}:${i}`) % 100) < LIT[light] * 100)
    .map(pts => `<polygon points="${pts}" fill="${LIT_FILL}" stroke="#2f2d3a" stroke-width="0.8"/>`).join('')
  const svg = `${head}<defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${MATRIX[light]}"/></filter></defs><g filter="url(#${id})">${inner}</g>${lit}</svg>`
  return { ...sp, svg }
}
