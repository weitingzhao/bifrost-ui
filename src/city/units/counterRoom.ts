import { Draw, faces, INK, type Sprite } from '../kit'
import { inset } from '../library/landmarks'
import { atLight } from '../library/night'
import type { Light } from '../light'
import { encode, metaphor } from '../library/dictionary'
import { hasConsole, roomConsole, CONSOLE_DEPTH, type ConsoleGauge, type ConsoleSpec } from './console'

/**
 * The counter room: the first room of a software building (箭10 2026-11-23: a software building's room is a Go
 * package, its first unit the counter). In this city a request is a car that drives to a counter (RULES, the
 * living things) and people are agents, so a package's routes are a drive-through:
 *   kiosks          one per route the package handles (the contract's request_response, by handler package)
 *   the lane        cars waiting in front of a kiosk, in four steps of how often it is asked (counter.queue)
 *   the shutter     down on a kiosk not asked since its process started: not measured, which is not zero
 *   the roof lamp   red when the route answered a 5xx in the last hour; dark when it did not
 *   the tag         the domain that promises the route, when it is not the one whose code serves it here
 *   the console     against the back wall, for the whole package: requests a minute, the share of 5xx
 * Stage 1's facts and the eight drawing rules: cockpit/ui-engine/state.md §6 and counter-stage1.md.
 * Nothing is made up: a route with no reading is shuttered, never drawn as idle; a reading the metric cannot name
 * (a wildcard proxy route) is shuttered with a question mark.
 */

export type CounterRoute = {
  method: string
  path: string
  /** Requests a minute over the last hour; null: no series (not asked since the process started). */
  perMin: number | null
  /** 5xx answers a minute over the last hour (the status bucket); null: no 5xx series. */
  failPerMin: number | null
  /** The domain whose contract promises this route, when it is not the domain that owns this package. */
  promisedBy?: string
  /** Why the route cannot be read at all (a wildcard proxy the metric never names); shown on the shutter. */
  unreadable?: string
}
export type CounterRoomReadings = { routes: CounterRoute[] }

/**
 * The queue's four steps (versioned: change them here, and the version, never per building). Requests a minute:
 * none 0; few under 1; busy under 10; jammed 10 or more. Measured 2026-11-23 (counter-stage1.md): most routes under
 * one a minute, a few between 1 and 30, one at 210.
 */
export const COUNTER_STEPS = { version: 1, few: 1, busy: 10 } as const
export function queueStep(perMin: number | null): 0 | 1 | 2 | 3 | null {
  if (perMin == null) return null
  if (perMin < 0.005) return 0
  return perMin < COUNTER_STEPS.few ? 1 : perMin < COUNTER_STEPS.busy ? 2 : 3
}

/** The package's summary: what its console shows and what it passes up to its building (stage 3). */
export type CounterSummary = { routes: number; measured: number; perMin: number | null; failShare: number | null; failing: number }
export function counterSummaryOf(r: CounterRoomReadings): CounterSummary {
  const read = r.routes.filter(x => x.perMin != null)
  const total = read.reduce((a, x) => a + (x.perMin ?? 0), 0)
  const fail = r.routes.reduce((a, x) => a + (x.failPerMin ?? 0), 0)
  return {
    routes: r.routes.length, measured: read.length,
    perMin: read.length ? total : null,
    failShare: read.length && total > 0 ? fail / total : read.length ? 0 : null,
    failing: r.routes.filter(x => (x.failPerMin ?? 0) > 0).length,
  }
}

// The floor: kiosks in rows along the room's width, each with its lane in front; the console's strip at the back.
const PITCH = 0.8, KW = 0.5, KD = 0.42, ROWD = 2.0, KH = 17, CAR_L = 0.34, CAR_W = 0.28, CAR_GAP = 0.44
const ROOMS: [number, number][] = [[4, 4], [4, 8], [8, 8]]
const colsOf = (w: number) => Math.floor((w - 0.4) / PITCH)
const rowsOf = (d: number) => Math.floor((d - CONSOLE_DEPTH - 0.3) / ROWD)
const holds = ([w, d]: [number, number]) => colsOf(w) * rowsOf(d)
/** The smallest room that holds a kiosk per route, one way round; the largest when none does (it says so). */
export const counterRoomShape = (routes: number): [number, number] => ROOMS.find(s => holds(s) >= routes) ?? ROOMS[ROOMS.length - 1]

const KIOSK = faces('#eef0f3', '#d5d9e0', '#bcc2cc'), ROOF = faces('#5b6475', '#4a5263', '#3c4352')
const CAR = faces('#f1f2f4', '#d6d9de', '#bfc3ca'), CAR_GLASS = '#3b4352'
const WALL = faces('#efe9dc', '#e2dac8', '#cfc6b2'), APRON = faces('#cfd2d6', '#b6b9be', '#a4a7ac')
const LAMP_RED = '#dc2626', LAMP_DARK = '#4b5563'

/** A route's path as a plate can hold it: without /api/v1/, the last parts, at most 15 characters. */
export function plateOf(method: string, path: string): string {
  const p = path.replace(/^\/api\/v\d+\//, '').replace(/\{[^}]+\}/g, '·')
  const short = p.length > 15 ? '…' + p.slice(-14) : p
  return `${method.slice(0, 4)} ${short}`
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function counterRoom(r: CounterRoomReadings): Sprite {
  const n = r.routes.length, [fw, fd] = counterRoomShape(n)
  const g = new Draw(fw, fd, 60)
  g.box(0, 0, fw, fd, 3, APRON, 0, 1.2)
  g.box(0, 0, fw, 0.18, 40, WALL, 0, 1.2)
  g.box(0, 0.18, 0.18, fd - 0.18, 40, WALL, 0, 1.2)

  const sum = counterSummaryOf(r)
  const gauges: ConsoleGauge[] = []
  if (sum.perMin != null) {
    const lg = sum.perMin <= 0 ? 0 : (Math.log10(sum.perMin) + 1) / 4
    gauges.push({ row: 'counter.traffic', name: 'REQ/MIN', share: encode('counter.traffic', lg), redFrom: 2, reading: sum.perMin < 10 ? sum.perMin.toFixed(2) : sum.perMin.toFixed(0) })
    gauges.push({ row: 'counter.failed', name: '5XX', share: encode('counter.failed', sum.failShare == null ? null : sum.failShare / 0.1), redFrom: 0.1, reading: sum.failShare == null ? '—' : `${(sum.failShare * 100).toFixed(1)}%` })
  }
  const spec: ConsoleSpec = { name: `${n} ROUTE${n === 1 ? "" : "S"}`, gauges }

  type Thing = { at: number; draw: () => void }
  const things: Thing[] = []
  if (n > 0) {
    metaphor('counter.windows')
    const cols = colsOf(fw), rows = rowsOf(fd), fits = cols * rows
    if (n > fits) g.text('left', 0.4, 0.18, 41, `${fits} OF ${n} KIOSKS FIT`, 5.5, '#b91c1c', 700)
    // Busiest first, then the quiet, then the shuttered: the room reads from the back-left like a page.
    const order = r.routes.map((x, i) => ({ x, i })).sort((a, b) => ((b.x.perMin ?? -1) - (a.x.perMin ?? -1)) || a.i - b.i).slice(0, fits).map(o => o.x)
    const used = Math.min(cols, order.length), x0 = (fw - used * PITCH) / 2 + (PITCH - KW) / 2
    const rowsN = Math.ceil(order.length / cols), y00 = CONSOLE_DEPTH + 0.15 + Math.max(0, (fd - CONSOLE_DEPTH - 0.3 - rowsN * ROWD) / 2)
    order.forEach((route, k) => {
      const col = k % cols, row = Math.floor(k / cols)
      const x = x0 + col * PITCH, y = y00 + row * ROWD
      const step = route.unreadable ? null : queueStep(route.perMin)
      const shut = step == null
      things.push({ at: x + y, draw: () => kiosk(g, x, y, route, shut) })
      if (!shut && step! > 0) {
        metaphor('counter.queue')
        const cars = encode('counter.queue', step! / 3)!
        for (let c = 0; c < cars; c++) {
          const cy = y + KD + 0.22 + c * CAR_GAP, cx = x + (KW - CAR_W) / 2
          things.push({ at: cx + cy, draw: () => car(g, cx, cy) })
        }
      }
    })
  } else {
    g.text('left', 0.6, 0.18, 30, 'NO ROUTES IN THE CONTRACT', 6, '#8a857a')
  }
  if (hasConsole(spec)) things.push({ at: -1, draw: () => roomConsole(g, fw, spec) })
  things.sort((a, b) => a.at - b.at).forEach(t => t.draw())
  return g.done()
}

function kiosk(g: Draw, x: number, y: number, route: CounterRoute, shut: boolean) {
  g.shadow(x, y, KW, KD, 0.3)
  // The lane: two painted lines from the kiosk to the front of the row.
  g.line([x - 0.04, y + KD + 0.05, 3.2], [x - 0.04, y + ROWD - 0.25, 3.2], '#ffffff', 1)
  g.line([x + KW + 0.04, y + KD + 0.05, 3.2], [x + KW + 0.04, y + ROWD - 0.25, 3.2], '#ffffff', 1)
  g.box(x, y, KW, KD, KH, KIOSK, 3, 1.1)
  g.box(x - 0.04, y - 0.04, KW + 0.08, KD + 0.08, 3, ROOF, 3 + KH, 1)
  const W = KW * 35.8
  if (shut) {
    metaphor('counter.shutter')
    let ribs = `<rect x="3" y="-15" width="${(W - 6).toFixed(1)}" height="12" fill="#8b93a3" stroke="${INK}" stroke-width="0.7"/>`
    for (let v = -13; v < -3; v += 2.2) ribs += `<line x1="3" y1="${v}" x2="${(W - 3).toFixed(1)}" y2="${v}" stroke="#6d7586" stroke-width="0.5"/>`
    if (route.unreadable) ribs += `<text x="${(W / 2).toFixed(1)}" y="-6" text-anchor="middle" font-family="'JetBrains Mono',monospace" font-size="7" font-weight="700" fill="#f2f0e8">?</text>`
    g.face('left', x, y + KD, 3, ribs)
  } else {
    // The service window: glass with its sill.
    g.face('left', x, y + KD, 3, `<rect x="3" y="-15" width="${(W - 6).toFixed(1)}" height="9" fill="#bfe0f5" stroke="${INK}" stroke-width="0.7"/><rect x="2" y="-6.5" width="${(W - 4).toFixed(1)}" height="1.6" fill="#9aa3b0"/>`)
    // The roof lamp: red with a 5xx in the hour, dark without.
    metaphor('counter.errors')
    const red = (route.failPerMin ?? 0) > 0
    const [cx, cy] = g.p(x + KW / 2, y + KD / 2, 3 + KH + 3)
    g.add(`<circle cx="${cx.toFixed(1)}" cy="${(cy - 2).toFixed(1)}" r="2.4" fill="${red ? LAMP_RED : LAMP_DARK}" stroke="${INK}" stroke-width="0.6"/>${red ? `<circle cx="${cx.toFixed(1)}" cy="${(cy - 2).toFixed(1)}" r="5" fill="${LAMP_RED}" opacity="0.25"/>` : ''}`)
  }
  // The plate under the window: method and path; a tag below for the domain that promises it, if not this one.
  g.face('left', x, y + KD, 3, `<rect x="0" y="-2.5" width="${W.toFixed(1)}" height="4" fill="#fbfaf6" stroke="${INK}" stroke-width="0.4"/><text x="1" y="0.6" font-family="'JetBrains Mono',monospace" font-size="2.6" font-weight="600" fill="${INK}">${esc(plateOf(route.method, route.path))}</text>`)
  if (route.promisedBy) {
    metaphor('counter.elsewhere')
    // On the front, above the window, where neither a neighbour nor the roof hides it.
    g.face('left', x, y + KD, 3, `<rect x="1" y="${-KH + 0.5}" width="${(W - 2).toFixed(1)}" height="3.6" fill="#fff7d6" stroke="${INK}" stroke-width="0.4"/><text x="2" y="${-KH + 3.3}" font-family="'JetBrains Mono',monospace" font-size="2.6" font-weight="700" fill="${INK}">${esc(('for ' + route.promisedBy).slice(0, 13))}</text>`)
  }
}

function car(g: Draw, x: number, y: number) {
  g.shadow(x, y, CAR_W, CAR_L, 0.15)
  g.box(x, y, CAR_W, CAR_L, 4, CAR, 3, 0.8)
  g.box(x + 0.03, y + 0.07, CAR_W - 0.06, CAR_L - 0.16, 3, faces('#e6e8eb', CAR_GLASS, CAR_GLASS), 7, 0.6)
}

/** The key the room's picture is kept under: every reading to the step it is drawn at. */
export const counterRoomKey = (r: CounterRoomReadings) =>
  `g2:counter:v${COUNTER_STEPS.version}:${r.routes.map(x => `${x.method}${x.path}:${x.unreadable ? 'u' : queueStep(x.perMin) ?? 'n'}:${(x.failPerMin ?? 0) > 0 ? 'f' : ''}:${x.promisedBy ?? ''}`).join(',')}`

/**
 * A building's counters summed (stage 3, 箭10 2026-11-23): the rooms' consoles added up, package by package, by the
 * same counterSummaryOf (never a second sum); plus the worst package's 5xx share, so one bad package is not averaged
 * away by quiet ones. What the building passes up to its district.
 */
export type CounterBuildingSummary = CounterSummary & { worstFailShare: number | null }
export function counterBuildingSummaryOf(rooms: readonly CounterRoomReadings[]): CounterBuildingSummary {
  const all = counterSummaryOf({ routes: rooms.flatMap(r => r.routes) })
  const shares = rooms.map(r => counterSummaryOf(r).failShare).filter((x): x is number => x != null)
  return { ...all, worstFailShare: shares.length ? Math.max(...shares) : null }
}

/**
 * The building's one reading outside (stage 4, 箭10 2026-11-23: one reading on the outside, never the room's again):
 * cars queueing at its door, in the counters' four steps of the building's requests a minute (building.flow). Errors,
 * shutters and per-route queues stay inside, in the rooms. Not read: no cars, nothing implied.
 */
export function withDoorQueue(building: Sprite, w: number, d: number, perMin: number | null, light: Light = 'day'): Sprite {
  const step = queueStep(perMin)
  if (!step) return building
  metaphor('building.flow')
  const cars = encode('building.flow', step / 3)!
  const above = building.height - (w + d) * 16 - 12
  const g = new Draw(w, d, above), lane = new Draw(w, d, above)
  inset(g, building, 0, 0)
  // In a row before the front door (the middle of the front face), the same cars as in the rooms (one size of car
  // everywhere, RULES: a car is as big on every level).
  const gap = CAR_L + 0.12, span = cars * gap - 0.12, y = d - CAR_W - 0.02, x0 = w / 2 - span / 2
  for (let c = 0; c < cars; c++) {
    const x = x0 + c * gap
    lane.shadow(x, y, CAR_L, CAR_W, 0.15)
    lane.box(x, y, CAR_L, CAR_W, 4, CAR, 0, 0.8)
    lane.box(x + 0.07, y + 0.03, CAR_L - 0.16, CAR_W - 0.06, 3, faces('#e6e8eb', CAR_GLASS, CAR_GLASS), 4, 0.6)
  }
  // The cars take the same light as the street (night.ts); the building came in already lit for its time of day.
  inset(g, atLight(lane.done(), light), 0, 0)
  return g.done()
}
export const doorQueueKey = (perMin: number | null) => `q${queueStep(perMin) ?? 'n'}`
