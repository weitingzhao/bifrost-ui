import type { Path } from './places'

/**
 * Traffic: what the system says to itself, now, driven on the roads (the Owner, 2026-11-20/21: the tech tree
 * shows who stands on whom; the city shows the traffic, the messages and the business data flowing; the ground
 * has only roads, and the kind of vehicle says the kind of talk).
 *
 * A trip is one real delivery the content saw: from the place that said it to the place that took it. The
 * engine drives each trip once, by its id, on the level on screen, at that level's grain: on the town, from the
 * sender's district to the taker's, along the highways (the same ports and roads a picked district's routes
 * take). A trip both of whose ends are under one child is that child's business: not driven here, counted.
 * Nothing moves that the system did not say (rule 0): no trip, no vehicle.
 *
 * The moving things' dictionary, one kind a row, as the parts' dictionary (library/dictionary.ts) is for the
 * readings. Kinds are added as their sources come (letters, wakes, readings: the plan in the platform's RULES).
 */
export type TripKind = 'event'

export type Vehicle = { kind: TripKind; vehicle: string; colour: number; means: string }

export const VEHICLES: Readonly<Record<TripKind, Vehicle>> = {
  event: { kind: 'event', vehicle: 'bus', colour: 0xd85a30, means: 'an event on the bus, taken by one of its readers: a coral bus from the publisher to that reader' },
}

export type Trip = {
  /** Driven once per id (a delivery: the event and who took it). */
  id: string
  kind: TripKind
  /** Who said it and who took it, as places in the tree. */
  from: Path
  to: Path
  /** What it carries (an event type), for the vehicle's hover. */
  what: string
}

/** The most vehicles on screen at once; the rest are counted, never queued (a backlog would replay the past as now). */
export const MAX_VEHICLES = 24

/** Seconds a vehicle takes per cell of road, and its bounds, so a long trip is not slow nor a short one a flash. */
export const DRIVE = { perCell: 0.22, min: 1.6, max: 5 }

/** Where a trip is driven on the level at `at`: between two children, or not here (one child's business, or not under it). */
export function tripAt(trip: Trip, at: Path): { from: string; to: string } | null {
  const d = at.length
  const under = (p: Path) => p.length > d && at.every((s, i) => p[i] === s)
  if (!under(trip.from) || !under(trip.to)) return null
  const from = trip.from[d], to = trip.to[d]
  return from === to ? null : { from, to }
}

/** A point at share t (0..1) of the way along a polyline, and the direction it faces there. */
export function along(pts: readonly { x: number; y: number }[], t: number): { x: number; y: number; dx: number; dy: number } {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y))
  const total = lens.reduce((a, b) => a + b, 0)
  if (pts.length < 2 || total === 0) return { x: pts[0]?.x ?? 0, y: pts[0]?.y ?? 0, dx: 1, dy: 0 }
  let left = Math.min(1, Math.max(0, t)) * total
  for (let i = 0; i < lens.length; i++) {
    const a = pts[i], b = pts[i + 1], l = lens[i]
    if (left <= l || i === lens.length - 1) {
      const k = l === 0 ? 0 : Math.min(1, left / l)
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dx: (b.x - a.x) / (l || 1), dy: (b.y - a.y) / (l || 1) }
    }
    left -= l
  }
  const z = pts[pts.length - 1]
  return { x: z.x, y: z.y, dx: 1, dy: 0 }
}

/** A polyline's length, in cells. */
export const lengthOf = (pts: readonly { x: number; y: number }[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0)
