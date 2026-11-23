import type { State } from './places'
import type { Tone } from './cards'

/**
 * One world (箭10, 2026-11-23; the World line's frame proposal, cockpit/ui-world/frame): every view (City, Signals,
 * Agents, Console and its tables) wears the same frame, type and status words, so switching views is not switching
 * websites. The words and colours are the Ops design system's (platform console/.design-sync/project: README §2,
 * guidelines/state-vocabulary.md, styles.css — 箭10's correction the same day): a closed vocabulary, and colour means
 * severity and nothing else. The engine carries them so every view gets one copy; views map their own words onto
 * them and define no colours of their own.
 */
export const WORLD = {
  ground: '#0a0c0f',
  surface: '#13171d',
  raised: '#1a1f26',
  line: '#2a313c',
  lineSoft: '#20262f',
  ink: '#e4e9ef',
  inkSoft: '#b6bfca',
  inkMute: '#7a8492',
  inkFaint: '#525b67',
  /** The one primary action per view and the active route (the current place); never a status. */
  accent: '#a3e635',
  accentInk: '#11180a',
  sans: "'Geist', 'DM Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const

/**
 * The status words: the Ops vocabulary, closed. `fill` is the lamp, `ink` the word written on the dark ground.
 * A view that has a state these do not cover asks for a new word; it does not invent a colour.
 */
export const STATUS_WORDS = ['ok', 'warn', 'fail', 'boundary', 'unknown', 'pending', 'info'] as const
export type StatusWord = (typeof STATUS_WORDS)[number]
/**
 * `paper`: the same word written on a light ground (the City's day and dusk cards), darker so it stays readable; the
 * Ops system is dark-only, so this is the one place its words get a light-ground ink.
 */
export const STATUS: Record<StatusWord, { fill: string; ink: string; paper: string; means: string }> = {
  ok: { fill: '#16a34a', ink: '#4ade80', paper: '#15803d', means: 'it holds, it ran, it passes its checks' },
  warn: { fill: '#ca8a04', ink: '#facc15', paper: '#a16207', means: 'needs attention: partly there, or answers but a check fails' },
  fail: { fill: '#dc2626', ink: '#f87171', paper: '#dc2626', means: 'failed, missing when it should be there, or older than its declared freshness' },
  boundary: { fill: '#475569', ink: '#94a3b8', paper: '#475569', means: 'not a fault: on its own cadence, the plan\'s edge, asleep on purpose' },
  unknown: { fill: '#64748b', ink: '#94a3b8', paper: '#64748b', means: 'cannot be judged: the read failed or the source is unavailable (it says which)' },
  pending: { fill: 'transparent', ink: '#7a8492', paper: '#8a8478', means: 'the read has not answered yet; never a finding' },
  info: { fill: '#38bdf8', ink: '#38bdf8', paper: '#0369a1', means: 'information, not a judgement' },
}

/** The frame's tokens as CSS custom properties (--w-*), for a root element's style. */
export function worldVars(): Record<string, string> {
  const v: Record<string, string> = {}
  for (const [k, x] of Object.entries(WORLD)) v[`--w-${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}`] = x
  for (const w of STATUS_WORDS) { v[`--w-${w}`] = STATUS[w].fill; v[`--w-${w}-ink`] = STATUS[w].ink }
  return v
}

/*
 * The mappings: each view's own words onto the vocabulary (the World line asked for one table every view follows).
 */

/** A place's state (places.ts). Standby is asleep on purpose: not a fault. Unread cannot be judged. */
export function statusOfState(s: State | undefined): StatusWord {
  return s === 'online' ? 'ok' : s === 'standby' ? 'boundary' : s === 'down' ? 'fail' : 'unknown'
}

/** A card's tone (cards.ts): the old words good/unknown map onto ok/unknown; a cell with no tone says nothing. */
export const statusOfTone = (t: Tone | undefined): StatusWord | undefined => t === 'good' ? 'ok' : t

// pass / passed, missed, due, draining (UI / Console 2026-11-23): a plugin's own quality check says PASS / FAIL and the
// research husbandry lanes say missed / due / draining; the Console had its own table for them, now it reads this one.
// crit (UI / Console 2026-11-23): the market-data plugin's doctor names its worst finding crit.
const WORDS: Record<string, StatusWord> = {
  ok: 'ok', good: 'ok', healthy: 'ok', ready: 'ok', success: 'ok', succeeded: 'ok', held: 'ok', nominal: 'ok', online: 'ok',
  pass: 'ok', passed: 'ok',
  warn: 'warn', warning: 'warn', caution: 'warn', problem: 'warn', degraded: 'warn', thin: 'warn', draining: 'warn',
  fail: 'fail', failed: 'fail', bad: 'fail', error: 'fail', down: 'fail', broken: 'fail', critical: 'fail', stale: 'fail',
  missed: 'fail', crit: 'fail',
  boundary: 'boundary', standby: 'boundary', cadence: 'boundary', 't+1': 'boundary', due: 'boundary',
  unknown: 'unknown', unread: 'unknown', 'not read': 'unknown',
  pending: 'pending', reading: 'pending', running: 'pending',
  info: 'info', none: 'info',
}

/**
 * A word some source says (a domain light, a run's state, an alert's severity), mapped by the table above. A word
 * the table does not know is `unknown`: never guessed into ok.
 */
export function statusOfWord(w: string | undefined | null): StatusWord {
  return (w && WORDS[w.trim().toLowerCase()]) || 'unknown'
}

/**
 * A reading's quality (observation readQuality): whether the reading can be trusted now, not whether the thing is
 * fine. Fresh: null (show the thing's own status). Older than its source's deadline: fail (the vocabulary's Stale).
 * Otherwise unknown (failed, missing, no time, clock mismatch).
 */
export function statusOfQuality(q: string): StatusWord | null {
  return q === 'Within refresh window' ? null : q === 'Stale' ? 'fail' : 'unknown'
}

/**
 * D1 (箭10 2026-11-23, with the identity epoch): one typed reference for an object across views, so a selection can
 * travel from one view to another without one view guessing what another's id means. `kind` names the namespace
 * (place, domain, ci, data, exchange, member, route…), `key` the object in it; `refKey` is the one string form (for
 * an address). A view that has no object of that kind says so; it never maps one kind onto another by its label.
 */
export type ObjectRef = { kind: string; key: string }
export const refKey = (r: ObjectRef) => `${encodeURIComponent(r.kind)}:${encodeURIComponent(r.key)}`
export function parseRef(s: string | null | undefined): ObjectRef | null {
  const i = s ? s.indexOf(':') : -1
  if (!s || i <= 0) return null
  try { return { kind: decodeURIComponent(s.slice(0, i)), key: decodeURIComponent(s.slice(i + 1)) } } catch { return null }
}

/**
 * One time model for every view (箭10 2026-11-23: Console's time and Signals' pin are one model). Live: the newest
 * reading's time (absent: not known). Pinned: the view shows a snapshot taken at `at`, fixed by the viewer at `since`.
 * A view that is live while another holds a pin stays live and may say so in its context line; it never shows the
 * other view's pinned time as its own.
 */
export type WorldTime = { mode: 'live'; at?: string } | { mode: 'pinned'; at: string; since?: string }
