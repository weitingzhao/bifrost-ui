/** V1 observation contract. Facts do not authorize actions; renderers never infer workflow transitions. */
export type Stage = 'sent' | 'delivered' | 'acknowledged' | 'accepted' | 'replied' | 'completed' | 'audited'
export type Evidence = { id: string; source: string; at: string; actor?: string }
export type Membership = { seat: string; organization: string; domain: string | null; role: 'owner' | 'temporary' | 'human' | 'outside'; invitedBy?: string }
export type Member = { id: string; label: string; memberships: Membership[]; activity?: { label: string; evidence: Evidence } }
export type CommunicationFact = {
  id: string; communication: string; channel: 'message' | 'event'; stage: Stage;
  from?: string; to?: string; label?: string; evidence: Evidence
}
export type Exchange = {
  id: string; channel: 'message' | 'event'; from?: string; to?: string; label: string;
  stages: Partial<Record<Stage, Evidence[]>>;
  issue?: { label: string; evidence: Evidence }
}
export type CommunicationSnapshot = {
  version: 1; members: Member[]; exchanges: Exchange[];
  coverage: { state: 'loading' | 'ready' | 'error'; note: string; updatedAt?: string; truncated: boolean }
}
export const STAGES: readonly Stage[] = ['sent', 'delivered', 'acknowledged', 'accepted', 'replied', 'completed', 'audited']
export const STAGE_LABEL: Record<Stage, string> = { sent: 'Sent', delivered: 'Delivery receipt', acknowledged: 'ACK', accepted: 'Accepted', replied: 'Reply', completed: 'Completed', audited: 'Audit' }
/** Rebuild from retained facts, so an ACK arriving before its message remains visible and deduplicated. */
export function exchangesOf(facts: readonly CommunicationFact[]): Exchange[] {
  const out = new Map<string, Exchange>(), seen = new Set<string>()
  for (const f of facts) {
    if (seen.has(f.id)) continue
    seen.add(f.id)
    const key = f.channel + ':' + f.communication
    const x = out.get(key) ?? { id: f.communication, channel: f.channel, label: f.communication, stages: {} }
    if (f.from) x.from = f.from
    if (f.to) x.to = f.to
    if (f.label) x.label = f.label
    const evidence = x.stages[f.stage] ?? []
    evidence.push(f.evidence)
    x.stages[f.stage] = evidence
    out.set(key, x)
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
    return Object.keys(stages).length ? [{ ...x, stages, issue }] : []
  })
}
