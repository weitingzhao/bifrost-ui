import { Draw, INK, faces, type Sprite } from '../kit'

/**
 * The district towns the first generation had no building for (the Owner, 2026-11-21: every district should
 * stand as a picture of what it is, from the engine's catalogue; the lines then claim theirs). Each is one
 * typical building a viewer knows at a glance, drawn at 4×4 with the kit, the same floor as the rest
 * (RULES.md, the drawing method). Nothing here moves or reads: what a district's readings show is drawn by its
 * modules; the landmark only says who the district is.
 *
 *   planning-office    the drafting office: a low office, a blueprint wall on its front, a plan table hall
 *   ground-support     the ground support yard: two service tanks, a pipe bridge, the low service hangar
 *   comms-tower        the communications station: a lattice tower, the equipment hall at its foot
 *   workshop           the workshop: a sawtooth roof over the shop floor, a roller door, the tool store
 *   measuring-office   the measuring office: the office and its gauge, a tall dial on the front
 *   dispatch           the dispatch station: red bay doors, the watch tower with its beacon
 */

const U = 35.8
const n1 = (v: number) => v.toFixed(1)

const lot = (g: Draw, fill = '#ebe7dc') => g.poly(fill, [[0.05, 0.05, 0], [3.95, 0.05, 0], [3.95, 3.95, 0], [0.05, 3.95, 0]], 0.9, '#b5ae9e')
const white = faces('#fbfaf6', '#e9e5dc', '#d4cfc3')

export function planningOffice(): Sprite {
  const g = new Draw(4, 4, 120)
  lot(g)
  // The plan hall: a long low hall at the back, north lights on its roof.
  g.shadow(0.4, 0.4, 3.2, 1.3, 0.4)
  g.box(0.4, 0.4, 3.2, 1.3, 30, faces('#eef1f6', '#dfe4ec', '#c9d0dc'))
  for (let k = 0; k < 4; k++) g.poly('#bfe0f5', [[0.6 + k * 0.75, 0.6, 30], [1.1 + k * 0.75, 0.6, 30], [1.1 + k * 0.75, 1.5, 38], [0.6 + k * 0.75, 1.5, 38]], 0.8)
  // The drafting office in front, its blueprint wall facing the street.
  g.shadow(0.8, 1.9, 2.4, 1.5, 0.4)
  g.box(0.8, 1.9, 2.4, 1.5, 46, white)
  const W = 2.4 * U
  let f = `<rect x="6" y="-40" width="${n1(W - 12)}" height="26" fill="#2f5d9e" stroke="${INK}" stroke-width="1.2"/>`
  for (let u = 12; u < W - 12; u += 9) f += `<line x1="${n1(u)}" y1="-40" x2="${n1(u)}" y2="-14" stroke="#9cc0ee" stroke-width="0.5"/>`
  for (let v = -36; v < -14; v += 6) f += `<line x1="6" y1="${v}" x2="${n1(W - 6)}" y2="${v}" stroke="#9cc0ee" stroke-width="0.5"/>`
  f += `<path d="M14,-20 L30,-34 L48,-26 L64,-36" fill="none" stroke="#ffffff" stroke-width="1.6"/><rect x="${n1(W / 2 - 7)}" y="-11" width="14" height="11" fill="#9aa3b0" stroke="${INK}" stroke-width="0.8"/>`
  g.face('left', 0.8, 3.4, 0, f)
  g.windows('right', 3.2, 1.9, 1.5, 8, 40, 2, 3)
  return g.done()
}

export function groundSupport(): Sprite {
  const g = new Draw(4, 4, 120)
  lot(g, '#e6e2d6')
  // Two service tanks at the back, a pipe bridge from them to the hangar.
  g.cylinder(1.0, 1.0, 20, 0, 52, '#f1efe8', '#c9c4b8', '#e4e0d6')
  g.cylinder(2.2, 0.9, 16, 0, 40, '#f1efe8', '#c9c4b8', '#e4e0d6')
  g.line([1.3, 1.4, 30], [2.4, 2.1, 30], '#7f8a9c', 2.4)
  g.line([2.4, 2.1, 30], [2.4, 2.1, 0], '#7f8a9c', 1.6)
  // The service hangar: low, wide, its door open on the yard.
  g.shadow(1.2, 2.1, 2.5, 1.5, 0.4)
  g.box(1.2, 2.1, 2.5, 1.5, 28, faces('#e9edf2', '#d7dde6', '#c2c9d4'))
  const W = 2.5 * U
  g.face('left', 1.2, 3.6, 0, `<rect x="${n1(W * 0.18)}" y="-22" width="${n1(W * 0.64)}" height="22" fill="#5a6273" stroke="${INK}" stroke-width="1"/><rect x="${n1(W * 0.18)}" y="-26" width="${n1(W * 0.64)}" height="3" fill="#f0b23a" stroke="${INK}" stroke-width="0.6"/>`)
  // The ground under everything: a base slab, the layers it stands on shown at its edge.
  g.poly('#d9d3c4', [[0.2, 3.7, 0], [3.8, 3.7, 0], [3.8, 3.7, -6], [0.2, 3.7, -6]], 0.8)
  return g.done()
}

export function commsTower(): Sprite {
  const g = new Draw(4, 4, 230)
  lot(g)
  // The equipment hall.
  g.shadow(1.4, 2.0, 2.2, 1.6, 0.4)
  g.box(1.4, 2.0, 2.2, 1.6, 30, white)
  g.windows('left', 1.4, 3.6, 2.2, 8, 24, 1, 4)
  // The lattice tower behind it, its legs braced, a red and white top.
  const legs: [number, number][] = [[0.8, 0.8], [1.6, 0.8], [1.6, 1.6], [0.8, 1.6]]
  const H = 200, top = 0.32
  const at = (i: number, z: number): [number, number, number] => {
    const k = z / H, [x, y] = legs[i]
    return [x + (1.2 - x) * k * (1 - top), y + (1.2 - y) * k * (1 - top), z]
  }
  for (let i = 0; i < 4; i++) g.line(at(i, 0), at(i, H), INK, 1.6)
  for (let z = 0; z < H; z += 25) for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    g.line(at(i, z), at(j, z + 25), '#7f8a9c', 0.8)
    g.line(at(i, z + 25), at(j, z + 25), '#7f8a9c', 0.8)
  }
  g.line(at(0, H - 20), at(0, H), '#d23c3c', 3.2)
  g.line(at(2, H - 20), at(2, H), '#d23c3c', 3.2)
  return g.done()
}

export function workshop(): Sprite {
  const g = new Draw(4, 4, 110)
  lot(g)
  // The shop floor under a sawtooth roof.
  const x0 = 0.5, x1 = 3.5, y0 = 0.6, y1 = 2.8, h = 30
  g.shadow(x0, y0, x1 - x0, y1 - y0, 0.4)
  g.box(x0, y0, x1 - x0, y1 - y0, h, faces('#f3efe6', '#e3ddd0', '#cdc6b7'))
  for (let k = 0; k < 4; k++) {
    const a = x0 + k * (x1 - x0) / 4, b = a + (x1 - x0) / 4
    g.poly('#bfe0f5', [[b, y0, h + 12], [b, y1, h + 12], [b, y1, h], [b, y0, h]], 0.8)
    g.poly('#e8e3d8', [[a, y0, h], [b, y0, h + 12], [b, y1, h + 12], [a, y1, h]], 0.9)
  }
  const W = (x1 - x0) * U
  g.face('left', x0, y1, 0, `<rect x="${n1(W * 0.12)}" y="-24" width="${n1(W * 0.36)}" height="24" fill="#8b93a3" stroke="${INK}" stroke-width="1"/>${[...Array(6)].map((_, i) => `<line x1="${n1(W * 0.12)}" y1="${-4 - i * 3.4}" x2="${n1(W * 0.48)}" y2="${-4 - i * 3.4}" stroke="#6d7586" stroke-width="0.6"/>`).join('')}`)
  g.windows('left', x0 + (x1 - x0) * 0.55, y1, (x1 - x0) * 0.42, 8, 24, 1, 3)
  // The tool store beside it.
  g.box(2.4, 3.0, 1.1, 0.7, 16, faces('#f0b23a', '#e09a2a', '#c9871f'))
  return g.done()
}

export function measuringOffice(): Sprite {
  const g = new Draw(4, 4, 140)
  lot(g)
  // The office.
  g.shadow(0.6, 1.2, 2.8, 2.2, 0.4)
  g.box(0.6, 1.2, 2.8, 2.2, 40, white)
  g.windows('right', 3.4, 1.2, 2.2, 8, 34, 2, 4)
  // The gauge on its front: a tall dial, its needle, the scale.
  const W = 2.8 * U, cx = W / 2, cy = -24, r = 15
  let f = `<circle cx="${n1(cx)}" cy="${cy}" r="${r}" fill="#ffffff" stroke="${INK}" stroke-width="1.4"/>`
  for (let k = 0; k <= 8; k++) { const a = Math.PI * (1.15 - k * 0.1625); f += `<line x1="${n1(cx + Math.cos(a) * (r - 4))}" y1="${n1(cy - Math.sin(a) * (r - 4))}" x2="${n1(cx + Math.cos(a) * (r - 1))}" y2="${n1(cy - Math.sin(a) * (r - 1))}" stroke="${INK}" stroke-width="0.8"/>` }
  f += `<line x1="${n1(cx)}" y1="${cy}" x2="${n1(cx + 9)}" y2="${cy - 8}" stroke="#d23c3c" stroke-width="1.6"/><circle cx="${n1(cx)}" cy="${cy}" r="1.8" fill="${INK}"/>`
  f += `<rect x="${n1(cx - 6)}" y="-9" width="12" height="9" fill="#9aa3b0" stroke="${INK}" stroke-width="0.8"/>`
  g.face('left', 0.6, 3.4, 0, f)
  // The record room behind: where the readings are kept.
  g.box(1.0, 0.4, 2.0, 0.7, 52, faces('#e4e7ee', '#d2d7e1', '#bcc3d0'))
  return g.done()
}

export function dispatch(): Sprite {
  const g = new Draw(4, 4, 170)
  lot(g)
  // The station: three red bay doors on the yard.
  g.shadow(0.5, 1.4, 2.6, 2.0, 0.4)
  g.box(0.5, 1.4, 2.6, 2.0, 34, white)
  const W = 2.6 * U, bay = (W - 16) / 3
  let f = ''
  for (let i = 0; i < 3; i++) f += `<rect x="${n1(6 + i * (bay + 2))}" y="-26" width="${n1(bay)}" height="26" fill="#d23c3c" stroke="${INK}" stroke-width="1"/>`
  f += `<rect x="6" y="-31" width="${n1(W - 12)}" height="4" fill="#ffffff" stroke="${INK}" stroke-width="0.6"/>`
  g.face('left', 0.5, 3.4, 0, f)
  // The watch tower at the back corner, its beacon on top.
  g.box(2.9, 0.6, 0.7, 0.7, 96, faces('#f3efe6', '#e3ddd0', '#cdc6b7'))
  g.windows('left', 2.9, 1.3, 0.7, 70, 90, 1, 1)
  g.cylinder(3.25, 0.95, 6, 96, 106, '#f0b23a', '#c9871f', '#ffd76a')
  return g.done()
}
