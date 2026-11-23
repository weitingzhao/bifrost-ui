import type { Path, Place } from './places'
import { STATUS } from './world'

/**
 * Alerts: what the system's own judges say is wrong now (the Owner, 2026-11-19 law 47 and 2026-11-21: the
 * picture never judges; the line that measures does). The content hands the alerts firing, each placed where it
 * belongs in the tree if it can say so; the engine shows them in the Alerts corner and lights the places they
 * sit under. An alert the content cannot place is still listed, under "not placed": never dropped.
 */
export type Severity = 'critical' | 'warning' | 'info'

export type CityAlert = {
  /** One per firing alert (its name and labels). */
  id: string
  name: string
  severity: Severity
  summary: string
  /** Where it belongs, or null when the content cannot say (shown as not placed). */
  at: Path | null
  /** When it started firing (ISO), when known. */
  since?: string
}

/** What the content read: the alerts, or why they are not known (a read that failed is not "no alerts"). */
export type AlertsRead = { alerts: CityAlert[]; source: string } | { alerts?: undefined; source: string; why: string }

const RANK: Record<Severity, number> = { critical: 3, warning: 2, info: 1 }
export const worst = (a: Severity | null, b: Severity): Severity => (a && RANK[a] >= RANK[b] ? a : b)

/** For each child of the place at `at`: how many alerts sit under it and the worst of them. */
export function alertsUnder(alerts: readonly CityAlert[], at: Path): Map<string, { n: number; worst: Severity }> {
  const d = at.length, out = new Map<string, { n: number; worst: Severity }>()
  for (const a of alerts) {
    const p = a.at
    if (!p || p.length <= d || !at.every((s, i) => p[i] === s)) continue
    const k = p[d], e = out.get(k)
    out.set(k, { n: (e?.n ?? 0) + 1, worst: worst(e?.worst ?? null, a.severity) })
  }
  return out
}

/** Alerts whose place is not in the tree are not placed either (a stale path is not a place). */
export function placedIn(tree: Place, a: CityAlert): boolean {
  if (!a.at || a.at.length === 0) return false
  let p: Place | undefined = tree
  for (const id of a.at) { p = p?.children.find(c => c.id === id); if (!p) return false }
  return true
}

/** A severity's colour: the Ops words' (world.ts), critical fail, warning warn, info info. */
const hexNum = (h: string) => parseInt(h.slice(1), 16)
export const SEVERITY_COLOUR: Record<Severity, number> = { critical: hexNum(STATUS.fail.fill), warning: hexNum(STATUS.warn.fill), info: hexNum(STATUS.info.fill) }
