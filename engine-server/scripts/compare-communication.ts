/**
 * Step 5's check (engine backend plan, 2026-11-23): within the same minute, read the letters, threads, work reports and
 * lineage straight from the platform and the engine's communication read with the same token and the same cutoff
 * (`through` = a few seconds ago, so a letter arriving between the two reads is outside both windows), apply the same
 * translation and projection to the direct reads (src/communication.ts, the views' projectCommunication), and compare
 * exchange by exchange (id, ends, every stage's evidence ids) and member by member (id, label, work evidence). Run per
 * scope with CHANNEL and MEMBER. Exit 0 only when equal. The token comes from the environment (COMPARE_TOKEN) and is
 * never printed.
 *
 *   PLATFORM=http://… ENGINE=http://… COMPARE_TOKEN=… [CHANNEL=message] [MEMBER=thread:…] node scripts/compare-communication.ts
 */
import { EVENTS, LETTER_TYPES, LINEAGE, PAGE, SEATS, THREADS, membersFrom, messageFacts, parseEventPage } from '../src/communication.ts'
import { exchangesOf, projectCommunication, type Exchange, type Member } from '../../src/communication/model.ts'
import { readFileSync } from 'node:fs'

const platform = process.env.PLATFORM, engine = process.env.ENGINE, token = process.env.COMPARE_TOKEN
if (!platform || !engine) { console.error('set PLATFORM and ENGINE'); process.exit(2) }
const scope = { channel: (process.env.CHANNEL ?? 'message') as 'message' | 'event', member: process.env.MEMBER ?? '' }
const through = new Date(Date.now() - 10_000).toISOString()
const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {}
const read = async (path: string) => { const r = await fetch(new URL(path, platform), { headers }); return r.ok ? r.json() as Promise<any> : null }
const roster = JSON.parse(readFileSync(new URL('../config/roster.json', import.meta.url), 'utf8')).members as Member[]

const q = new URLSearchParams({ channel: scope.channel, member: scope.member, through })
const [ev, th, st, li, via] = await Promise.all([
  read(`${EVENTS}?${new URLSearchParams({ limit: String(PAGE), types: LETTER_TYPES.join(',') })}`), read(THREADS), read(SEATS), read(LINEAGE),
  fetch(new URL(`/engine/v1/communication?${q}`, engine), { headers }).then(r => r.json() as Promise<any>),
])
const events = parseEventPage(ev)
if (!events) { console.error('direct letters read failed or invalid'); process.exit(1) }
if (!via.data) { console.error(`engine read: ${JSON.stringify(via.evidence)}`); process.exit(1) }
const exchanges = exchangesOf(messageFacts(events))
const members = membersFrom(exchanges, th?.threads ?? [], Array.isArray(st) ? st : st?.seats ?? [], li?.threads ?? [], roster, via.data.coverage.updatedAt)
const p = projectCommunication(exchanges, through, scope)

const exKey = (x: Exchange) => JSON.stringify([x.channel, x.id, x.from, x.to, Object.entries(x.stages).map(([s, es]) => [s, (es ?? []).map(e => e.id).sort()]).sort()])
const mKey = (m: Member) => JSON.stringify([m.id, m.label, m.work?.evidence?.id ?? null, m.work?.goal ?? null])
const diffs: string[] = []
const cmp = (what: string, a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b)
  for (const x of A) if (!B.has(x)) diffs.push(`${what} only direct: ${x.slice(0, 120)}`)
  for (const x of B) if (!A.has(x)) diffs.push(`${what} only engine: ${x.slice(0, 120)}`)
}
cmp('exchange', p.exchanges.map(exKey), (via.data.exchanges as Exchange[]).map(exKey))
cmp('member', members.map(mKey), (via.data.members as Member[]).map(mKey))
console.log(`communication through ${through} (${scope.channel}${scope.member ? ', ' + scope.member : ''}): direct ${p.exchanges.length} exchanges / ${members.length} members, engine ${via.data.exchanges.length} / ${via.data.members.length}; differing ${diffs.length}`)
for (const d of diffs.slice(0, 30)) console.log('  ' + d)
process.exit(diffs.length === 0 ? 0 : 1)
