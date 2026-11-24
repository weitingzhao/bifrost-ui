/**
 * Incremental Server-Sent Events parser for a fetch-streamed body (the Console's sseParser.ts, the same rules: the
 * bus stream keeps the bearer, which an EventSource cannot send). Feed it decoded chunks in order; it returns the
 * messages and comments each chunk completed. Lines end in LF or CRLF.
 */
export type SseMessage = { id?: string; event?: string; data: string }
export type SseBatch = { messages: SseMessage[]; comments: string[]; retry?: number }

export class SseParser {
  private buffer = ''
  private data: string[] = []
  private id: string | undefined
  private event: string | undefined
  /** The last id the stream named: what to send as Last-Event-ID when reconnecting. */
  lastEventId: string | undefined

  push(chunk: string): SseBatch {
    const out: SseBatch = { messages: [], comments: [] }
    this.buffer += chunk
    for (let nl = this.buffer.indexOf('\n'); nl >= 0; nl = this.buffer.indexOf('\n')) {
      let line = this.buffer.slice(0, nl)
      this.buffer = this.buffer.slice(nl + 1)
      if (line.endsWith('\r')) line = line.slice(0, -1)
      this.line(line, out)
    }
    return out
  }

  private line(line: string, out: SseBatch): void {
    if (line === '') {
      if (this.data.length > 0) out.messages.push({ data: this.data.join('\n'), ...(this.id !== undefined ? { id: this.id } : {}), ...(this.event !== undefined ? { event: this.event } : {}) })
      this.data = []; this.id = undefined; this.event = undefined
      return
    }
    if (line.startsWith(':')) { out.comments.push(line.slice(1).replace(/^ /, '')); return }
    const colon = line.indexOf(':')
    const field = colon < 0 ? line : line.slice(0, colon)
    const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '')
    if (field === 'data') this.data.push(value)
    else if (field === 'event') this.event = value
    else if (field === 'id' && !value.includes('\u0000')) { this.id = value; this.lastEventId = value }
    else if (field === 'retry' && /^\d+$/.test(value)) out.retry = Number(value)
  }
}

/** One SSE message to write: an optional id (the cursor to resume from), an event name and JSON data. */
export const sseMessage = (event: string, data: unknown, id?: string) => `${id ? `id: ${id}\n` : ''}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
