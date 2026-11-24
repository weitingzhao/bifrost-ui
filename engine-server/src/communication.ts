import { readFileSync } from 'node:fs'
import { envelope, type Envelope, type ReadEvidence } from './envelope.ts'
import { readAs, type Upstream } from './upstream.ts'
// The engine's communication model, the views' own (pure, imports nothing; boundary.test.ts holds it to that): the
// projection is evaluated here with the same function the views use, never a second copy (engine-backend.md §4).
import { exchangesOf, membersOf, projectCommunication, type CommunicationFact, type CommunicationScope, type Exchange, type Member } from '../../src/communication/model.ts'

/**
 * Step 5 (engine backend plan, 2026-11-23; Agents' scope vocabulary, 2026-11-23; 箭10 2026-11-24): who talks to whom,
 * evaluated here for the Agents view. GET /engine/v1/communication?channel=&member=&through=&requested=&before=
 *   channel    message | event (default message; event when `requested` is an event)
 *   member     an exact member id (thread:…, owner): exchanges it sent or received; empty = everyone
 *   through    the time cutoff (ISO; default now); not scope
 *   requested  the exchange asked for (`channel:id`); resolved inside the window, never rewritten by scope
 *   before     an event id: read the letters before it (history), instead of the latest
 * Upstream, with the viewer's token: the latest letter events (/api/v1/agentrt/events, 500), the agent threads, the
 * seats' work reports and two days of commit lineage; the crew roster is configuration (config/roster.json, the
 * Console's snapshot until the switch). The translation is the Console's adapter (communication/adapter.ts), moved:
 * platform vocabulary ends here. Data: {scope, through, requested, resolved, state, exchanges (the window), members
 * (all, not cut by scope), coverage {state, note, updatedAt, truncated, history {hasOlder, note}, scoped}}.
 * Event deliveries are not in this read yet: they arrive on /engine/v1/traffic, and the coverage says so.
 */
export const EVENTS = '/api/v1/agentrt/events'
export const THREADS = '/api/v1/agent/threads'
export const SEATS = '/api/v1/agentrt/seats'
export const LINEAGE = '/api/v1/lineage?days=2'
export const LETTER_TYPES = ['message_posted', 'seat.mail.arrived', 'message_acked'] as const
export const PAGE = 500
const ROSTER: { importedAt?: string; members: Member[] } = JSON.parse(readFileSync(new URL('../config/roster.json', import.meta.url), 'utf8'))

type Rec = Record<string, unknown>
const record = (v: unknown): Rec => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Rec : {}
const str = (v: unknown) => typeof v === 'string' ? v : undefined
const text = (v: unknown) => typeof v === 'string' ? v : ''
const whole = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0

export type RuntimeEventRow = { event_id: number; event_stream_id: string; seq: number; event_type: string; actor_id: string; body: Rec; at: string }
/** A page with a hole nobody could see is refused whole (the Console's parseEventPage, the same checks). */
export function parseEventPage(value: unknown): RuntimeEventRow[] | null {
  const r = record(value)
  if (!Array.isArray(r.events) || typeof r.next !== 'string' || !/^\d+\.\d+$/.test(r.next)) return null
  const out: RuntimeEventRow[] = []
  for (const v of r.events) {
    const e = record(v)
    if (!whole(e.event_id) || !whole(e.seq) || typeof e.event_type !== 'string' || e.event_type === '' || typeof e.event_stream_id !== 'string'
      || typeof e.at !== 'string' || !Number.isFinite(Date.parse(e.at)) || e.body_json === null || typeof e.body_json !== 'object' || Array.isArray(e.body_json)) return null
    out.push({ event_id: e.event_id, event_stream_id: e.event_stream_id, seq: e.seq, event_type: e.event_type, actor_id: text(e.actor_id), body: record(e.body_json), at: e.at })
  }
  return out
}

/** Every letter event is appended to the recipient's mailbox stream, `mbox:<to>`; the ACK's actor is never read as either party. */
const mailbox = (stream: string | undefined) => stream?.startsWith('mbox:') && stream.length > 5 ? stream.slice(5) : undefined
export function messageFacts(events: readonly RuntimeEventRow[]): CommunicationFact[] {
  return events.flatMap(e => {
    const id = str(e.body.message_id)
    if (!id || !(LETTER_TYPES as readonly string[]).includes(e.event_type)) return []
    return [{ id: 'agentrt:' + e.event_id, communication: id, channel: 'message' as const,
      stage: e.event_type === 'message_posted' ? 'sent' as const : e.event_type === 'seat.mail.arrived' ? 'delivered' as const : 'acknowledged' as const,
      ...(e.event_type === 'message_posted' ? { from: e.actor_id, to: str(e.body.to) ?? mailbox(e.event_stream_id), label: str(e.body.kind), replyTo: str(e.body.reply_to) } : { to: mailbox(e.event_stream_id) ?? str(e.body.to) }),
      evidence: { id: String(e.event_id), source: 'agentrt/events', at: e.at, actor: e.actor_id } }]
  })
}

type Thread = { thread: string; vendor: string; session?: string; title?: string; work?: string; status: string; event?: string; tool?: string; reason?: string; at: string; binding?: { state?: string; root?: string; plan_node_id?: string; external_work_id?: string } }
type SeatStatus = { seat: string; message_id: string; at: string; goal?: string; doing?: string; waiting_on?: string; next?: string; percent?: number; percent_basis?: string; charter?: string; problem?: string }
type LineageThread = { session?: string; repos: { repo: string; commits: { subject: string; sha: string; at: string; landed?: boolean; ref?: string; reached?: { env: string }[] }[] }[] }

/** Members from the roster, the threads, the work reports and the lineage (the Console's communicationSnapshot, moved). */
export function membersFrom(exchanges: readonly Exchange[], threads: readonly Thread[], statuses: readonly SeatStatus[], lineage: readonly LineageThread[], roster: readonly Member[], updatedAt: string): Member[] {
  const identities = new Map(roster.map(m => [m.id, m]))
  for (const t of threads) {
    const id = t.thread.startsWith('thread:') ? t.thread : 'thread:' + t.thread
    const old = identities.get(id)
    const recent = Date.parse(updatedAt) - Date.parse(t.at) < 86_400_000
    if (!old && !recent && !exchanges.some(x => x.from === id || x.to === id)) continue
    identities.set(id, { id, label: t.title || old?.label || t.vendor + ' · ' + t.thread.slice(0, 8), memberships: old?.memberships ?? [],
      work: { line: t.title || t.thread, doing: t.work, binding: t.binding ? [t.binding.state, t.binding.root, t.binding.plan_node_id, t.binding.external_work_id].filter(Boolean).join(' · ') : undefined, evidence: { id: t.thread, source: 'agent/threads', at: t.at } },
      records: [{ label: 'Last reported thread event', detail: [t.event, t.tool, t.reason].filter(Boolean).join(' · '), evidence: { id: t.thread + ':' + t.at, source: 'agent/threads', at: t.at } }],
      activity: { label: t.status.replaceAll('_', ' '), evidence: { id: t.thread, source: 'agent/threads', at: t.at } } })
  }
  // Exact identifiers only; a vendor session alias counts only when the thread source binds it to one thread.
  const resolve = (seat: string) => {
    if (identities.has(seat)) return seat
    const session = seat.replace(/^thread:/, '')
    const ids = [...new Set(threads.filter(t => t.thread === session || t.session === session).map(t => t.thread.startsWith('thread:') ? t.thread : 'thread:' + t.thread))]
    return ids.length === 1 ? ids[0] : seat
  }
  for (const s of [...statuses].sort((a, b) => a.at.localeCompare(b.at))) {
    const id = resolve(s.seat), old = identities.get(id)
    const evidence = { id: s.message_id, source: 'agentrt/seats', at: s.at }
    identities.set(id, { id, label: old?.label ?? id, memberships: old?.memberships ?? [], ...old,
      work: { line: old?.work?.line ?? id, goal: s.goal, doing: s.doing, waitingOn: s.waiting_on, next: s.next, progress: s.problem ? undefined : s.percent, progressBasis: s.percent_basis, declaredCharter: s.charter, binding: old?.work?.binding, problem: s.problem, evidence },
      records: [...(old?.records ?? []), { label: 'Latest work report', detail: [s.goal, s.doing, s.waiting_on ? 'Waiting: ' + s.waiting_on : '', s.next ? 'Next: ' + s.next : ''].filter(Boolean).join(' · '), evidence }] })
  }
  for (const line of lineage) {
    if (!line.session) continue
    const id = resolve('thread:' + line.session), old = identities.get(id)
    if (!old) continue
    const records = line.repos.flatMap(r => r.commits.map(c => ({ label: c.subject, detail: r.repo + ' · ' + c.sha + ' · ' + (c.landed ? 'On main' : 'On branch ' + c.ref) + (c.reached?.length ? ' · Releases: ' + c.reached.map(e => e.env).join(', ') : ''), evidence: { id: c.sha, source: 'lineage', at: c.at }, href: '#commit-lineage' })))
    identities.set(id, { ...old, records: [...(old.records ?? []), ...records] })
  }
  return membersOf(exchanges, [...identities.values()])
}

export type CommunicationRead = {
  scope: CommunicationScope; through: string; requested: string | null; resolved: string | null; state: 'resolved' | 'missing' | 'empty'
  exchanges: Exchange[]; members: Member[]
  coverage: { state: 'ready' | 'error'; note: string; updatedAt: string; truncated: boolean; history: { hasOlder: boolean; note: string }; scoped: boolean }
}
export type CommunicationQuery = { scope: CommunicationScope; through: string; requested: string | null; before: number | null }

const MEMBER = /^[A-Za-z0-9:._@-]{0,160}$/
/** The query from the URL, or why it is not one. */
export function queryOf(url: URL, now = new Date()): CommunicationQuery | { error: string } {
  const requested = url.searchParams.get('requested') || null
  const channel = url.searchParams.get('channel') || (requested?.startsWith('event:') ? 'event' : 'message')
  if (channel !== 'message' && channel !== 'event') return { error: 'channel must be message or event' }
  const member = url.searchParams.get('member') ?? ''
  if (!MEMBER.test(member)) return { error: 'member must be an exact member id (thread:…, owner)' }
  const t = url.searchParams.get('through')
  if (t && !Number.isFinite(Date.parse(t))) return { error: 'through must be an ISO time' }
  const b = url.searchParams.get('before')
  if (b && !/^[1-9]\d{0,17}$/.test(b)) return { error: 'before must be an event id' }
  return { scope: { channel, member }, through: t ? new Date(t).toISOString() : now.toISOString(), requested, before: b ? Number(b) : null }
}

export async function readCommunication(up: Upstream, authorization: string | undefined, q: CommunicationQuery, now = () => new Date()): Promise<Envelope<CommunicationRead>> {
  const params = new URLSearchParams({ limit: String(PAGE), types: LETTER_TYPES.join(',') })
  if (q.before) params.set('before_event_id', String(q.before))
  const [ev, th, st, li] = await Promise.all([
    readAs<unknown>(up, `${EVENTS}?${params}`, authorization),
    readAs<{ threads?: Thread[] }>(up, THREADS, authorization),
    readAs<SeatStatus[] | { seats?: SeatStatus[] }>(up, SEATS, authorization),
    readAs<{ threads?: LineageThread[] }>(up, LINEAGE, authorization),
  ])
  const evidence: ReadEvidence[] = []
  const events = ev.evidence.outcome === 'read' ? parseEventPage(ev.body) : null
  evidence.push(ev.evidence.outcome === 'read' && !events ? { ...ev.evidence, source: EVENTS, outcome: 'error', detail: 'invalid page: the letters are not shown rather than shown with holes' } : { ...ev.evidence, source: EVENTS })
  const threads = th.evidence.outcome === 'read' && Array.isArray(th.body?.threads) ? th.body.threads : []
  evidence.push(th.evidence)
  const seats = st.evidence.outcome === 'read' ? (Array.isArray(st.body) ? st.body : Array.isArray((st.body as { seats?: SeatStatus[] })?.seats) ? (st.body as { seats: SeatStatus[] }).seats : []) : []
  evidence.push(st.evidence)
  const lineage = li.evidence.outcome === 'read' && Array.isArray(li.body?.threads) ? li.body.threads : []
  evidence.push({ ...li.evidence, source: LINEAGE })

  const updatedAt = now().toISOString()
  const exchanges = exchangesOf(messageFacts(events ?? []))
  const members = membersFrom(exchanges, threads, seats, lineage, ROSTER.members, updatedAt)
  const p = projectCommunication(exchanges, q.through, q.scope, q.requested)
  const hasOlder = (events?.length ?? 0) === PAGE
  const failed = evidence.filter(e => e.outcome === 'error').map(e => `${e.source}: ${e.detail}`)
  const note = [
    failed.length ? `Not read: ${failed.join('; ')}.` : '',
    'Messages, inbox arrivals and ACK evidence from the platform ledger. Replies require explicit sender links and matching participants; older letters may lack links. Opening and acceptance are not recorded by this source. Absence of a reply is not agent inactivity.',
    `Crew membership is a source snapshot imported ${ROSTER.importedAt ?? '(date unknown)'}; it is not live presence.`,
    'Work reports are self-reported, timestamped. Commit records cover the last two days.',
    q.scope.channel === 'event' ? 'Event deliveries are not in this read: they arrive on /engine/v1/traffic.' : '',
    q.scope.member || q.scope.channel !== 'message' ? 'The window is cut by scope; members are not.' : '',
  ].filter(Boolean).join(' ')
  return envelope('communication', evidence, {
    scope: p.scope, through: p.through, requested: p.requested, resolved: p.resolved, state: p.state, exchanges: p.exchanges, members,
    coverage: { state: events ? 'ready' : 'error', note, updatedAt, truncated: hasOlder, scoped: Boolean(q.scope.member) || q.scope.channel !== 'message',
      history: { hasOlder, note: !events ? 'The ledger was not read; history coverage is not known.' : hasOlder ? `Earlier letters are available: read again with before=${Math.min(...events.map(e => e.event_id))}.` : 'Beginning of the available filtered ledger reached; retention may limit older records.' } },
  })
}
