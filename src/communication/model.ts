/** V1 observation contract. Facts do not authorize actions; renderers never infer workflow transitions. */
export type Stage = 'sent' | 'delivered' | 'opened' | 'acknowledged' | 'accepted' | 'replied' | 'completed' | 'audited'
export type Evidence = { id: string; source: string; at: string; actor?: string }
export type Membership = { seat: string; organization: string; domain: string | null; role: 'owner' | 'temporary' | 'human' | 'outside'; invitedBy?: string }
export type Member = { id: string; label: string; memberships: Membership[]; activity?: { label: string; evidence: Evidence } }
export type CommunicationFact = {
  id: string; communication: string; channel: 'message' | 'event'; stage: Stage;
  from?: string; to?: string; label?: string; replyTo?: string; evidence: Evidence
}
export type Exchange = {
  id: string; channel: 'message' | 'event'; from?: string; to?: string; label: string;
  stages: Partial<Record<Stage, Evidence[]>>;
  replyTo?: string; replies?: { id: string; evidence: Evidence }[];
  issue?: { label: string; evidence: Evidence }
}
export type CommunicationSnapshot = {
  version: 1; members: Member[]; exchanges: Exchange[];
  coverage: { state: 'loading' | 'ready' | 'error'; note: string; updatedAt?: string; truncated: boolean }
}
export const STAGES: readonly Stage[] = ['sent', 'delivered', 'opened', 'acknowledged', 'accepted', 'replied', 'completed', 'audited']
export const STAGE_LABEL: Record<Stage, string> = { sent: 'Sent', delivered: 'Inbox delivery', opened: 'Opened by recipient', acknowledged: 'ACK', accepted: 'Accepted', replied: 'Reply', completed: 'Completed', audited: 'Audit' }
/** Rebuild from retained facts, so an ACK arriving before its message remains visible and deduplicated. */
export function exchangesOf(facts: readonly CommunicationFact[]): Exchange[] {
  const out = new Map<string, Exchange>(), seen = new Set<string>()
  for (const f of facts) {
    if (seen.has(f.id)) continue
    seen.add(f.id)
    const key = f.channel + ':' + f.communication
    const x: Exchange = out.get(key) ?? { id: f.communication, channel: f.channel, label: f.communication, stages: {} }
    if (f.from) x.from = f.from
    if (f.to) x.to = f.to
    if (f.label) x.label = f.label
    if (f.replyTo) x.replyTo = f.replyTo
    const evidence = x.stages[f.stage] ?? []
    evidence.push(f.evidence)
    x.stages[f.stage] = evidence
    out.set(key, x)
  }
  // Only an explicit link with reversed participants establishes a reply. Order is irrelevant.
  for (const reply of out.values()) {
    if (reply.channel !== 'message' || !reply.replyTo || reply.replyTo === reply.id) continue
    const parent = out.get('message:' + reply.replyTo)
    const evidence = reply.stages.sent?.[0]
    if (!parent || !evidence || !parent.from || !parent.to || reply.from !== parent.to || reply.to !== parent.from) continue
    parent.replies = [...(parent.replies ?? []), { id: reply.id, evidence }]
    parent.stages.replied = [...(parent.stages.replied ?? []), evidence]
  }
  return [...out.values()].sort((a,b) => lastAt(b).localeCompare(lastAt(a)))
}
export function lastAt(x: Exchange): string {
  return Object.values(x.stages).flat().map(e => e.at).sort().at(-1) ?? ''
}
/** Missing identity is an explicit member with no invented domain or role. */
export function membersOf(exchanges: readonly Exchange[], roster: readonly Member[]): Member[] {
  const out = new Map(roster.map(m => [m.id, m]))
  for (const x of exchanges) for (const id of [x.from, x.to]) {
    if (id && !out.has(id)) out.set(id, { id, label: id, memberships: [] })
  }
  return [...out.values()]
}

/** Time filtering applies only to evidence, never reconstructs member activity from message traffic. */
export function evidenceThrough(exchanges: readonly Exchange[], through: string): Exchange[] {
  if (!through) return [...exchanges]
  const cutoff = Date.parse(through)
  return exchanges.flatMap(x => {
    const stages: Exchange['stages'] = {}
    for (const stage of STAGES) {
      const evidence = x.stages[stage]?.filter(e => Date.parse(e.at) <= cutoff)
      if (evidence?.length) stages[stage] = evidence
    }
    const issue = x.issue && Date.parse(x.issue.evidence.at) <= cutoff ? x.issue : undefined
    const replies = x.replies?.filter(r => Date.parse(r.evidence.at) <= cutoff)
    return Object.keys(stages).length ? [{ ...x, stages, issue, replies }] : []
  })
}

/** Elapsed observation, not a claim that an agent stopped working or owes a response. */
export function replyObservation(x: Exchange, asOf?: string): string {
  if (x.channel !== 'message') return 'Event delivery evidence'
  if (x.stages.replied?.length) return 'Linked reply observed'
  const sent = x.stages.sent?.map(e => Date.parse(e.at)).filter(Number.isFinite).sort((a,b)=>a-b)[0]
  const end = Date.parse(asOf ?? '')
  if (sent === undefined || !Number.isFinite(end) || end < sent) return 'No linked reply observed'
  const seconds = Math.floor((end - sent) / 1000)
  const elapsed = seconds < 60 ? seconds + 's' : seconds < 3600 ? Math.floor(seconds / 60) + 'm' : seconds < 86400 ? Math.floor(seconds / 3600) + 'h' : Math.floor(seconds / 86400) + 'd'
  return 'No linked reply observed · ' + elapsed + ' since sent at last read'
}
