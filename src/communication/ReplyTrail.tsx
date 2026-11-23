import { replyObservation, type Exchange } from './model'

/** The same evidence navigation in every observation mode; no transport or workflow writes. */
export function ReplyTrail({ exchange, exchanges, asOf, onSelect }: { exchange: Exchange; exchanges: readonly Exchange[]; asOf?: string; onSelect: (id: string) => void }) {
  const parent = exchange.replyTo && exchanges.find(x => x.channel === 'message' && x.id === exchange.replyTo)
  return <section className="comm-reply-trail" aria-label="Letter conversation">
    <p>{replyObservation(exchange, asOf)}</p>
    <small>Measured within the loaded evidence window. This does not mean the recipient is idle, late, or required to reply.</small>
    {exchange.replyTo && <p>Sender references: {parent ? <button onClick={() => onSelect('message:' + parent.id)}>{parent.label} · {parent.id}</button> : <span>{exchange.replyTo} · original not in loaded window</span>}</p>}
    {!!exchange.replies?.length && <><h4>Linked replies</h4>{exchange.replies.map(r => <button key={r.id} onClick={() => onSelect('message:' + r.id)}>{r.id} · {new Date(r.evidence.at).toLocaleString()}</button>)}</>}
  </section>
}
