/**
 * Calendar dates as ISO strings (`YYYY-MM-DD`), computed in UTC so a date is
 * the same day in every time zone. The calendar kit (CalendarGrid · MiniMonth ·
 * TimeStrip, design §17.9) takes and gives dates in this form only; which day
 * is "today" (New York, Chicago …) is the caller's to decide.
 */

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const MON_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const DAY_MS = 86_400_000

function toUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1))
}

function fromUtc(t: Date): string {
  return t.toISOString().slice(0, 10)
}

/** `iso` moved by `n` days. */
export function isoAddDays(iso: string, n: number): string {
  return fromUtc(new Date(toUtc(iso).getTime() + n * DAY_MS))
}

/** Day of week, 0 = Sunday … 6 = Saturday. */
export function isoDow(iso: string): number {
  return toUtc(iso).getUTCDay()
}

export function isWeekendIso(iso: string): boolean {
  const w = isoDow(iso)
  return w === 0 || w === 6
}

/** `YYYY-MM` of a date. */
export function isoMonthOf(iso: string): string {
  return iso.slice(0, 7)
}

/** `YYYY-MM` moved by `n` months. */
export function shiftIsoMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  return fromUtc(new Date(Date.UTC(y, m - 1 + n, 1))).slice(0, 7)
}

/** Whole days from `a` to `b` (b − a). */
export function isoDaysBetween(a: string, b: string): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / DAY_MS)
}

/** §17.9 #6 — panels and lists: `Fri 11 Sep`. */
export function formatDayLabel(iso: string): string {
  const t = toUtc(iso)
  return `${DOW_SHORT[t.getUTCDay()]} ${t.getUTCDate()} ${MON_SHORT[t.getUTCMonth()]}`
}

/** §17.9 #6 — titles: `September 2026`. */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${MON_LONG[(m || 1) - 1]} ${y}`
}

/** §17.9 #6 — a week title: `Mon 7 – Fri 11 Sep` (both months named when they differ). */
export function formatWeekLabel(from: string, to: string): string {
  const a = toUtc(from)
  const b = toUtc(to)
  const head =
    a.getUTCMonth() === b.getUTCMonth()
      ? `${DOW_SHORT[a.getUTCDay()]} ${a.getUTCDate()}`
      : `${DOW_SHORT[a.getUTCDay()]} ${a.getUTCDate()} ${MON_SHORT[a.getUTCMonth()]}`
  return `${head} – ${formatDayLabel(to)}`
}

/** §17.9 #6 — distance from today: `today` · `in 7d` · `3d ago`. */
export function formatRelativeDays(iso: string, today: string): string {
  const n = isoDaysBetween(today, iso)
  if (n === 0) return 'today'
  return n > 0 ? `in ${n}d` : `${-n}d ago`
}

/**
 * The columns of a time strip (§17.9 #1): every weekday from `from` to `to`
 * inclusive, plus a weekend day only when `include(date)` says something is
 * dated on it (or it is `today`).
 */
export function stripDates(
  from: string,
  to: string,
  opts: { include?: (iso: string) => boolean; today?: string } = {},
): string[] {
  const out: string[] = []
  if (from > to) return out
  for (let d = from, i = 0; d <= to && i < 3700; d = isoAddDays(d, 1), i++) {
    const weekend = isWeekendIso(d)
    if (!weekend || d === opts.today || opts.include?.(d)) out.push(d)
  }
  return out
}

export { DOW_SHORT, MON_SHORT }
