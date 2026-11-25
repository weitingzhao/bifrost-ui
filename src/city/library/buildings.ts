import { Draw, INK, faces, type Sprite } from '../kit'
import { shade } from '../sprites'
import { inset } from './landmarks'
import { atLight } from './night'
import { hash } from '../kit'
import type { Light } from '../light'

/**
 * The building catalogue: what a piece of software in a district stands as (ISSUE-9: the
 * buildings in a district are the map's, all one generic building so far; the engine draws a catalogue of kinds,
 * each line claims its own). A kind is a role a piece of code plays in the running system, never a domain's name:
 *
 *   service    a service hall: a row of counter windows under a canopy, where requests come to be answered
 *   worker     a works hall: a pitched roof with roof ventilators and roller doors, work done without a caller
 *   store      a silo group with its headhouse: what is kept and outlives a restart
 *   library    a tool library: an open shed, the tools on a pegboard, for others to take and use
 *   gate       a checkpoint: lanes under a canopy, a booth and a barrier each, where things are judged to pass
 *   other      a plain block: the role is not declared (ISSUE-9: every level has a plain Other kind;
 *              many plain blocks is itself the signal that roles are not sorted out)
 *
 * One picture, one meaning, city-wide (RULES.md). Each kind is one design that grows with its footprint (4×4, 4×8,
 * 8×8, either way round): the same parts, more of them along the long side; never one picture stretched.
 * Drawn with the kit, the first generation's floor (RULES.md, the drawing method): three faces, outlined, detail on
 * the walls, roofs not bare, a shadow under each. The district's hue is the one identity band; nothing here reads
 * or shows a reading (what a building holds is in its rooms), so nothing here looks like a lamp, dial or number.
 */
export const BUILDING_ROLES = ['service', 'worker', 'store', 'library', 'gate', 'other'] as const
export type BuildingRole = (typeof BUILDING_ROLES)[number]

/** What each kind means and the evidence a claim should rest on: the bench and the `?` card show it. */
export const ROLE_MEANING: Record<BuildingRole, { label: string; means: string; evidence: string }> = {
  service: { label: 'Service hall', means: 'answers requests: its packages hold the handlers of the domain\'s routes', evidence: 'the contract\'s request_response handlers live in it' },
  worker: { label: 'Works hall', means: 'does work nobody calls for: loops, consumers, scheduled jobs', evidence: 'it starts goroutines or consumers at boot, or a CronJob runs it' },
  store: { label: 'Silos', means: 'keeps what outlives a restart: tables, files, streams it owns', evidence: 'the domain\'s tables or storage are written through it' },
  library: { label: 'Tool library', means: 'code others take and use; it runs nothing of its own', evidence: 'imported by other buildings or domains, no handler, no loop' },
  gate: { label: 'Checkpoint', means: 'judges whether something may pass: policies, checks, admissions', evidence: 'its verdicts allow or refuse a change, a release or a request' },
  other: { label: 'Plain block', means: 'its role is not declared yet', evidence: 'none: no claim made' },
}

const U = 35.8
const n1 = (v: number) => v.toFixed(1)
const WHITE = faces('#fbfaf6', '#e9e5dc', '#d4cfc3')
const GLASS = '#c9d6e3'

/**
 * A footprint laid out along its long side: u runs along it, v across it, v's far edge is the street front.
 * Wide (w ≥ d): u is x, the front is the +y face (the left face on screen). Deep: u is y, the front the +x face.
 */
class Lay {
  readonly L: number
  readonly D: number
  readonly wide: boolean
  constructor(readonly g: Draw, w: number, d: number) { this.wide = w >= d; this.L = this.wide ? w : d; this.D = this.wide ? d : w }
  xy(u: number, v: number): [number, number] { return this.wide ? [u, v] : [v, u] }
  pt(u: number, v: number, z: number): [number, number, number] { return [...this.xy(u, v), z] }
  box(u: number, v: number, du: number, dv: number, h: number, c: ReturnType<typeof faces>, z = 0, sw?: number) {
    const [x, y] = this.xy(u, v), [w, d] = this.wide ? [du, dv] : [dv, du]
    this.g.box(x, y, w, d, h, c, z, sw); return this
  }
  shadow(u: number, v: number, du: number, dv: number) { const [x, y] = this.xy(u, v), [w, d] = this.wide ? [du, dv] : [dv, du]; this.g.shadow(x, y, w, d, 0.4); return this }
  poly(fill: string, q: [number, number, number][], sw?: number) { this.g.poly(fill, q.map(([u, v, z]) => this.pt(u, v, z)), sw); return this }
  line(a: [number, number, number], b: [number, number, number], stroke = INK, sw = 1) { this.g.line(this.pt(...a), this.pt(...b), stroke, sw); return this }
  /** A quad on the front face at v, along u from a to b (both orientations, each face's own plane). */
  front(v: number, a: number, b: number, z0: number, z1: number, fill: string, sw = 0.9) {
    if (this.wide) this.g.onLeft(0, v, a, b, z0, z1, fill, sw); else this.g.onRight(v, 0, a, b, z0, z1, fill, sw)
    return this
  }
  /** A quad on the end face at u (the short side facing the street), across v from a to b. */
  end(u: number, a: number, b: number, z0: number, z1: number, fill: string, sw = 0.9) {
    if (this.wide) this.g.onRight(u, 0, a, b, z0, z1, fill, sw); else this.g.onLeft(0, u, a, b, z0, z1, fill, sw)
    return this
  }
  windowsFront(v: number, u0: number, span: number, z0: number, z1: number, rows: number, cols: number) {
    if (this.wide) this.g.windows('left', u0, v, span, z0, z1, rows, cols); else this.g.windows('right', v, u0, span, z0, z1, rows, cols)
    return this
  }
  windowsEnd(u: number, v0: number, span: number, z0: number, z1: number, rows: number, cols: number) {
    if (this.wide) this.g.windows('right', u, v0, span, z0, z1, rows, cols); else this.g.windows('left', v0, u, span, z0, z1, rows, cols)
    return this
  }
  /** Free drawing on the front face, its own plane, from u0 (the face's left on screen). */
  faceFront(v: number, u0: number, u1: number, z: number, inner: string) {
    if (this.wide) this.g.face('left', u0, v, z, inner); else this.g.face('right', v, u1, z, inner)
    return this
  }
}

const lot = (g: Draw, w: number, d: number, fill = '#ebe7dc') =>
  g.poly(fill, [[0.05, 0.05, 0], [w - 0.05, 0.05, 0], [w - 0.05, d - 0.05, 0], [0.05, d - 0.05, 0]], 0.9, '#b5ae9e')
const band = (hue: string) => faces(shade(hue, 0.15), hue, shade(hue, -0.15))
/** How many of a repeated part fit a long side: one per two cells, at least two. */
const along = (L: number) => Math.max(2, Math.round(L / 2))

/** The service hall: a long low hall, a glass front of counter windows under one canopy, a queue rail before each. */
function service(w: number, d: number, hue: string): Sprite {
  const g = new Draw(w, d, 110), y = new Lay(g, w, d)
  lot(g, w, d)
  const u0 = 0.4, u1 = y.L - 0.4, v0 = y.D * 0.25, v1 = y.D - 1.1, h = 40
  y.shadow(u0, v0, u1 - u0, v1 - v0).box(u0, v0, u1 - u0, v1 - v0, h, WHITE)
  y.front(v1, u0, u1, h - 6, h, band(hue).left, 1)
  y.end(u1, v0, v1, h - 6, h, band(hue).right, 1)
  y.windowsEnd(u1, v0, v1 - v0, 8, h - 10, 1, Math.max(2, Math.round((v1 - v0) * 1.6)))
  // The counters: one window per bay, a desk line across it, the bays split by pillars.
  const n = along(y.L) + 1, bay = (u1 - u0) / n
  for (let i = 0; i < n; i++) {
    const a = u0 + i * bay, b = a + bay
    y.front(v1, a + bay * 0.14, b - bay * 0.14, 6, h - 10, GLASS, 1)
    y.front(v1, a + bay * 0.14, b - bay * 0.14, 11, 13, '#9aa3b0', 0.7)
    y.front(v1, a + bay * 0.47, a + bay * 0.53, 13, h - 10, '#e9e5dc', 0.6)
    // The queue rail on the forecourt: two posts and a band.
    const q = u0 + i * bay + bay / 2
    y.line([q - 0.25, v1 + 0.65, 0], [q - 0.25, v1 + 0.65, 9], '#7f8a9c', 1.2).line([q + 0.25, v1 + 0.65, 0], [q + 0.25, v1 + 0.65, 9], '#7f8a9c', 1.2)
    y.line([q - 0.25, v1 + 0.65, 8], [q + 0.25, v1 + 0.65, 8], hue, 2)
  }
  // The canopy over the whole front, on slim posts.
  const cz = h - 4
  for (let i = 0; i <= n; i++) y.line([u0 + i * bay, v1 + 0.3, 0], [u0 + i * bay, v1 + 0.3, cz - 2], '#9aa3b0', 1.4)
  y.poly('#f4f2ec', [[u0, v1, cz], [u1, v1, cz], [u1, v1 + 0.35, cz - 2], [u0, v1 + 0.35, cz - 2]], 1.2)
  y.poly(shade(hue, -0.1), [[u0, v1 + 0.35, cz - 2], [u1, v1 + 0.35, cz - 2], [u1, v1 + 0.35, cz - 5], [u0, v1 + 0.35, cz - 5]], 1)
  // Roof: a parapet and air handlers.
  y.poly('#efece5', [[u0 + 0.1, v0 + 0.1, h + 2], [u1 - 0.1, v0 + 0.1, h + 2], [u1 - 0.1, v1 - 0.1, h + 2], [u0 + 0.1, v1 - 0.1, h + 2]], 0.8)
  for (let i = 0; i < along(y.L); i++) { const [x, yy] = y.xy(u0 + 0.6 + i * 2, v0 + 0.4); g.unit(x, yy, h + 2, 0.45) }
  return g.done()
}

/** The works hall: a tall shed under a pitched roof, ventilators along the ridge, roller doors on the yard. */
function worker(w: number, d: number, hue: string): Sprite {
  const g = new Draw(w, d, 130), y = new Lay(g, w, d)
  lot(g, w, d, '#e6e2d6')
  const u0 = 0.4, u1 = y.L - 0.4, v0 = 0.5, v1 = y.D - 1.0, h = 36, r = 22, vm = (v0 + v1) / 2
  const wall = faces('#eef0f2', '#dfe3e8', '#c8ced8')
  y.shadow(u0, v0, u1 - u0, v1 - v0).box(u0, v0, u1 - u0, v1 - v0, h, wall)
  // The gable end and the front slope of the roof.
  if (y.wide) g.poly(wall.right, [[u1, v0, h], [u1, v1, h], [u1, vm, h + r]], 1.7)
  else g.poly(wall.left, [[v0, u1, h], [v1, u1, h], [vm, u1, h + r]], 1.7)
  y.poly('#8e98a8', [[u0, v1, h], [u1, v1, h], [u1, vm, h + r], [u0, vm, h + r]], 1.7)
  // Roof seams down the slope.
  for (let u = u0 + 0.5; u < u1; u += 0.5) y.line([u, v1, h], [u, vm, h + r], '#7a8494', 0.5)
  y.front(v1, u0, u1, h - 6, h, band(hue).left, 1)
  // Roller doors, ribbed, and a man door beside each.
  const n = along(y.L), bay = (u1 - u0) / n
  for (let i = 0; i < n; i++) {
    const a = u0 + i * bay + bay * 0.18, b = a + bay * 0.5
    y.front(v1, a, b, 0, 24, '#8b93a3', 1.1)
    for (let z = 4; z < 24; z += 3.5) y.line([a, v1, z], [b, v1, z], '#6d7586', 0.5)
    y.front(v1, b + bay * 0.1, b + bay * 0.22, 0, 14, '#5a6273', 0.9)
  }
  y.windowsEnd(u1, v0, v1 - v0, 14, h - 10, 1, 2)
  // Ventilators along the ridge: turbine caps on short stacks.
  for (let i = 0; i < n; i++) {
    const [x, yy] = y.xy(u0 + bay * (i + 0.5), vm)
    g.cylinder(x, yy, 5, h + r - 2, h + r + 6, '#d7dbe2', '#9aa3b0', '#eef0f2')
    g.cylinder(x, yy, 7, h + r + 6, h + r + 11, '#c3c9d3', '#8e98a8', '#dfe3e8')
  }
  return g.done()
}

/** The silos: a headhouse at the end, the silos in a row (two rows when deep), a conveyor gallery along their tops. */
function store(w: number, d: number, hue: string): Sprite {
  const g = new Draw(w, d, 190), y = new Lay(g, w, d)
  lot(g, w, d, '#e6e2d6')
  const H = 86, R = 22
  // The headhouse: a tall narrow tower, windows up it, the band at its top.
  const hu = 0.5, hv = 0.6, hw = 1.0, hd = 1.2, hh = H + 34
  y.shadow(hu, hv, hw, hd).box(hu, hv, hw, hd, hh, faces('#f0ece2', '#ded8ca', '#c8c1b1'))
  y.windowsFront(hv + hd, hu, hw, 20, hh - 16, 4, 1)
  y.front(hv + hd, hu, hu + hw, hh - 8, hh - 2, band(hue).left, 1)
  y.poly('#d4cfc3', [[hu, hv, hh], [hu + hw, hv, hh], [hu + hw, hv + hd, hh], [hu, hv + hd, hh]], 1)
  // The silos, back row first: a body, a cone cap, a ring band.
  const rows = y.D >= 8 ? 2 : 1, cols = Math.max(2, Math.floor((y.L - 2.2) / 1.5))
  const cells: [number, number][] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([2.2 + c * 1.5 + 0.7, (rows === 1 ? y.D * 0.45 : 1.6 + r * (y.D - 3.4)) ])
  cells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]))
  for (const [u, v] of cells) {
    const [x, yy] = y.xy(u, v)
    g.shadow(x - 0.5, yy - 0.5, 1, 1, 0.4)
    g.cylinder(x, yy, R, 0, H, '#f1efe8', '#c9c4b8', '#e4e0d6')
    const [cx, cy] = g.p(x, yy, H)
    g.add(`<path d="M${n1(cx - R)},${n1(cy)} A${R},${R / 2} 0 0 0 ${n1(cx + R)},${n1(cy)} L${n1(cx)},${n1(cy - 16)} Z" fill="#d9d5cc" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`)
    const [bx, by] = g.p(x, yy, H * 0.72)
    g.add(`<path d="M${n1(bx - R)},${n1(by)} A${R},${R / 2} 0 0 0 ${n1(bx + R)},${n1(by)}" fill="none" stroke="${hue}" stroke-width="3"/>`)
    // The ladder up its front.
    const [lx, ly0] = g.p(x, yy, 4), [, ly1] = g.p(x, yy, H - 4)
    g.add(`<line x1="${n1(lx + R * 0.55)}" y1="${n1(ly0 + R * 0.4)}" x2="${n1(lx + R * 0.55)}" y2="${n1(ly1 + R * 0.4)}" stroke="#9aa3b0" stroke-width="1"/>`)
  }
  // The conveyor gallery from the headhouse along the tops.
  const gv = rows === 1 ? y.D * 0.45 : 1.6
  y.line([hu + hw, gv, H + 14], [2.2 + (cols - 1) * 1.5 + 0.7, gv, H + 14], '#7f8a9c', 3)
  return g.done()
}

/** The tool library: an open-fronted shed, a pegboard of tools on its back wall, a counter, crates of parts out front. */
function library(w: number, d: number, hue: string): Sprite {
  const g = new Draw(w, d, 100), y = new Lay(g, w, d)
  lot(g, w, d)
  const u0 = 0.5, u1 = y.L - 0.5, v0 = 0.6, v1 = y.D - 1.2, h = 30
  const wall = faces('#f3efe6', '#e3ddd0', '#cdc6b7')
  y.shadow(u0, v0, u1 - u0, v1 - v0).box(u0, v0, u1 - u0, v1 - v0, h, wall)
  // The open front: dark bays, a pegboard of tool shapes in each, the counter across the bottom.
  const n = along(y.L), bay = (u1 - u0) / n, W = bay * U
  for (let i = 0; i < n; i++) {
    const a = u0 + i * bay + bay * 0.08, b = u0 + (i + 1) * bay - bay * 0.08
    y.front(v1, a, b, 2, h - 7, '#5a5348', 1)
    let f = `<rect x="${n1(W * 0.1)}" y="-${h - 9}" width="${n1(W * 0.68)}" height="${h - 20}" fill="#c8a978" stroke="${INK}" stroke-width="0.6"/>`
    for (let k = 0; k < 4; k++) for (let j = 0; j < 2; j++) f += `<circle cx="${n1(W * (0.16 + k * 0.17))}" cy="${-h + 12 + j * 7}" r="0.7" fill="#7a6648"/>`
    // A wrench, a hammer, a saw: the shapes everyone knows.
    const x = W * 0.16
    f += `<path d="M${n1(x)},-${h - 12} l2,0 l0,8 l-2,0 Z M${n1(x - 1.5)},-${h - 12} a2.6,2.6 0 1 1 5,0" fill="#4f5664"/>`
    f += `<rect x="${n1(x + 8)}" y="-${h - 11}" width="2" height="10" fill="#8b5e34"/><rect x="${n1(x + 5.5)}" y="-${h - 11}" width="7" height="3" fill="#4f5664"/>`
    f += `<path d="M${n1(x + 16)},-${h - 11} l8,0 l0,3 l-8,6 Z" fill="#9aa3b0" stroke="#4f5664" stroke-width="0.5"/>`
    y.faceFront(v1, u0 + i * bay, u0 + (i + 1) * bay, 0, f)
    y.front(v1, a, b, 2, 9, '#d9b48a', 1)
  }
  y.front(v1, u0, u1, h - 6, h, band(hue).left, 1)
  y.end(u1, v0, v1, h - 6, h, band(hue).right, 1)
  y.windowsEnd(u1, v0, v1 - v0, 8, h - 10, 1, 2)
  // A shallow roof lip and a vent.
  y.poly('#e8e3d8', [[u0 - 0.1, v0 - 0.1, h + 3], [u1 + 0.1, v0 - 0.1, h + 3], [u1 + 0.1, v1 + 0.25, h + 3], [u0 - 0.1, v1 + 0.25, h + 3]], 1.1)
  const [rx, ry] = y.xy(u0 + 0.8, v0 + 0.5); g.unit(rx, ry, h + 3, 0.4)
  // Crates of parts on the forecourt, ready to go out.
  for (let i = 0; i < n; i++) y.box(u0 + i * bay + bay * 0.3, v1 + 0.4, 0.45, 0.4, 8, faces('#e2c08e', '#c9a46e', '#b38c58'))
  return g.done()
}

/** The checkpoint: lanes under one canopy, a booth and a striped barrier in each, the office behind. */
function gate(w: number, d: number, hue: string): Sprite {
  const g = new Draw(w, d, 100), y = new Lay(g, w, d)
  lot(g, w, d, '#d9d6cf')
  const u0 = 0.4, u1 = y.L - 0.4
  // The office at the back.
  const ov = 0.4, od = Math.max(0.9, y.D * 0.25), oh = 30
  y.shadow(u0, ov, u1 - u0, od).box(u0, ov, u1 - u0, od, oh, WHITE)
  y.windowsFront(ov + od, u0, u1 - u0, 8, oh - 8, 1, Math.round((u1 - u0) * 1.6))
  y.front(ov + od, u0, u1, oh - 5, oh, band(hue).left, 1)
  // The lanes: painted lines across the yard, a booth and a barrier at each.
  const n = along(y.L) + 1, lane = (u1 - u0) / n, vb = ov + od + 0.4, ve = y.D - 0.3
  for (let i = 0; i <= n; i++) y.line([u0 + i * lane, vb, 0.5], [u0 + i * lane, ve, 0.5], '#ffffff', 1.4)
  const vm = (vb + ve) / 2
  for (let i = 0; i < n; i++) {
    const bu = u0 + i * lane + 0.08
    y.box(bu, vm - 0.3, 0.32, 0.6, 22, faces('#f4f2ec', shade(hue, 0.2), shade(hue, 0))).front(vm + 0.3, bu, bu + 0.32, 10, 18, GLASS, 0.8)
    // The barrier arm, red and white, across the lane.
    const z = 12, a = bu + 0.32, b = u0 + (i + 1) * lane - 0.12, segs = 6
    for (let s = 0; s < segs; s++) y.line([a + (b - a) * s / segs, vm, z], [a + (b - a) * (s + 1) / segs, vm, z], s % 2 ? '#ffffff' : '#d23c3c', 2.6)
  }
  // The canopy: a beam over the booth line, high enough to show the booths, on four posts.
  const cz = 44, c0 = vm - 0.4, c1 = vm + 0.4
  for (const [u, v] of [[u0 + 0.1, c0], [u1 - 0.1, c0], [u0 + 0.1, c1], [u1 - 0.1, c1]] as [number, number][]) y.line([u, v, 0], [u, v, cz], '#9aa3b0', 1.6)
  y.box(u0, c0, u1 - u0, c1 - c0, 5, faces('#f7f5f0', band(hue).left, band(hue).right), cz, 1.4)
  return g.done()
}

/** The plain block: a box with rows of windows and a door; no band, no sign, no rooftop detail beyond its lip. */
function other(w: number, d: number): Sprite {
  const g = new Draw(w, d, 90), y = new Lay(g, w, d)
  lot(g, w, d)
  const u0 = 0.5, u1 = y.L - 0.5, v0 = 0.5, v1 = y.D - 0.6, h = 34
  const grey = faces('#e7e5e0', '#d3d0c9', '#bfbbb3')
  y.shadow(u0, v0, u1 - u0, v1 - v0).box(u0, v0, u1 - u0, v1 - v0, h, grey)
  y.windowsFront(v1, u0, u1 - u0, 6, h - 6, 2, Math.round((u1 - u0) * 1.4))
  y.windowsEnd(u1, v0, v1 - v0, 6, h - 6, 2, Math.round((v1 - v0) * 1.4))
  y.poly('#dcd9d2', [[u0 + 0.1, v0 + 0.1, h + 2], [u1 - 0.1, v0 + 0.1, h + 2], [u1 - 0.1, v1 - 0.1, h + 2], [u0 + 0.1, v1 - 0.1, h + 2]], 0.8)
  return g.done()
}

const DRAW: Record<BuildingRole, (w: number, d: number, hue: string) => Sprite> = { service, worker, store, library, gate, other }

/** A building of a kind for its footprint (cells, either way round) in its district's hue. */
export function buildingSprite(role: BuildingRole, w: number, d: number, hue: string, light: Light = 'day'): Sprite {
  if (w < 8 || d < 8) return atLight(DRAW[role](w, d, hue), light, hash(`${role}:${w}x${d}`))
  // A square big footprint is two long ones, back row first: the same parts, more of them, never a bigger box.
  const half = buildingSprite(role, w, d / 2, hue, light), g = new Draw(w, d, half.height - (w + d / 2) * 16 - 12)
  inset(g, half, 0, 0)
  inset(g, half, 0, d / 2)
  return g.done()
}
/** The texture key of the same picture: it changes whenever the picture would. */
export const buildingKey = (role: BuildingRole, w: number, d: number, hue: string, light: Light = 'day') => `g2:role:${role}:${w}x${d}:${hue}:${light}`
export const isBuildingRole = (s: unknown): s is BuildingRole => (BUILDING_ROLES as readonly unknown[]).includes(s)
