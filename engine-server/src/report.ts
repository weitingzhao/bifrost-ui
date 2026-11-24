import { envelope, type Envelope, type ReadEvidence } from './envelope.ts'
import { readAs, type Upstream } from './upstream.ts'
// The engine's contract types (type-only, erased at run time; boundary.test.ts): a report is panels of the engine's
// own blocks, the shape the views' ObservationReportView draws (bifrost-ui observation-report).
import type { ObservationPanel } from '../../src/observation/model.ts'
import type { Block } from '../../src/city/cards.ts'

/**
 * Step 6 (engine backend plan, 2026-11-23; 箭10 2026-11-24): run reports, read here instead of by Ledger's CI report
 * and Signals operations. GET /engine/v1/report?kind=…
 *   kind=pipeline&pipeline=   the retained runs of one pipeline   (/api/v1/delivery/pipelines/{p}/runs)
 *   kind=run&pipeline=&run=   one run's record, tasks and steps   (/api/v1/delivery/pipelines/{p}/timings?run=)
 *   kind=logs&run=            one run's log tail (namespace cicd) (/api/v1/delivery/runs/{run}/logs?ns=cicd)
 * The projections are the Console's (domains/delivery/observation-report), moved: status, revision and attempt
 * identity are the delivery's, never inferred; a source whose identity does not match the request is an error, not
 * another run's report. Data: an ObservationReport (version 1).
 */
export type ObservationReport = {
  version: 1; id: string; capturedAt: string; scope: string
  panels: ObservationPanel[]; evidence: ReadEvidence[]
  objects: Record<string, { label: string; blocks: Block[]; evidence: ReadEvidence[] }>
}

type RunView = { name: string; namespace: string; pipeline: string; revision?: string; status: string; reason?: string; start_time?: string; completion_time?: string }
type RunsResponse = { cluster_id: string; namespace: string; pipeline: string; reachability: string; detail: string; runs: RunView[]; generated_at: string }
type TimingResult = { name: string; value: string }
type TimingStep = { name: string; status: string; started_at?: string; finished_at?: string; exit_code?: number }
type TimingTask = { name: string; task: string; status: string; created_at?: string; finished_at?: string; results: TimingResult[]; steps: TimingStep[] }
type TimingRun = { name: string; pipeline: string; revision?: string; status: string; reason?: string; created_at: string; start_time?: string; completion_time?: string; trigger?: string; results: TimingResult[]; tasks: TimingTask[]; skipped?: string[] }
type Timings = { as_of: string; runs: TimingRun[] }
type LogsResponse = { cluster_id: string; namespace: string; run_name: string; logs: string; generated_at: string; last_log_at?: string }

const missing = 'Not recorded'
const NAME = /^[a-z0-9][a-z0-9.-]{0,252}$/

export function pipelineReport(data: RunsResponse, receivedAt: string): ObservationReport {
  const source = `/api/v1/delivery/pipelines/${encodeURIComponent(data.pipeline)}/runs`
  const evidence: ReadEvidence[] = [{ source, receivedAt, evaluatedAt: data.generated_at,
    outcome: data.reachability === 'fail' ? 'error' : data.reachability === 'unknown' ? 'missing' : 'read',
    detail: `Source reachability: ${data.reachability}. ${data.detail}. Refresh deadline not supplied.` }]
  const columns = ['Run', 'Namespace', 'Pipeline', 'Revision', 'Status', 'Reason', 'Started at', 'Completed at']
  const rows = data.runs.map(run => ({ key: JSON.stringify(['pipeline-run', data.cluster_id, run.namespace, run.name]),
    cells: [run.name, run.namespace, run.pipeline, run.revision ?? 'Not supplied', run.status, run.reason ?? 'Not supplied', run.start_time ?? 'Not supplied', run.completion_time ?? 'Not supplied'] }))
  return { version: 1, id: JSON.stringify(['pipeline-report', data.cluster_id, data.pipeline, receivedAt]), capturedAt: receivedAt,
    scope: `${data.cluster_id} / ${data.namespace} / ${data.pipeline}; retained runs only`, evidence,
    panels: [{ id: 'runs', label: 'Pipeline runs', blocks: [{ kind: 'note', text: 'Source status is not proof of deployment. Retained records do not establish complete history.' },
      { kind: 'table', head: columns.map(label => ({ label })), rows: rows.map(row => ({ ...row, open: row.key })), empty: 'No runs supplied; history completeness is unknown.' }] }],
    objects: Object.fromEntries(rows.map(row => [row.key, { label: row.cells[0], evidence, blocks: [{ kind: 'facts', rows: columns.map((label, i) => ({ label, value: row.cells[i] })) }] }])) }
}

const resultsBlock = (results: TimingResult[]): Block => ({ kind: 'table', head: [{ label: 'Result' }, { label: 'Value' }],
  rows: results.map((r, i) => ({ key: String(i), cells: [r.name, r.value === '' ? '(empty)' : r.value] })), empty: 'No results retained.' })

export const timingsPath = (pipeline: string, run: string) => {
  const q = new URLSearchParams({ limit: '60' })
  if (pipeline === 'bifrost-land') q.set('repo', 'bifrost-platform')
  q.set('run', run)
  return `/api/v1/delivery/pipelines/${encodeURIComponent(pipeline)}/timings?${q}`
}

/** One run's record; throws when the source names another run or a task twice (the view says it, never shows the wrong run). */
export function runReport(data: Timings, pipeline: string, name: string, receivedAt: string): ObservationReport {
  if (data.runs.length > 1 || data.runs.some(r => r.name !== name || r.pipeline !== pipeline)) throw new Error('source identity does not match the requested run')
  const run = data.runs[0]
  const evidence: ReadEvidence[] = [{ source: timingsPath(pipeline, name), receivedAt, evaluatedAt: data.as_of, outcome: run ? 'read' : 'missing',
    detail: 'Current Platform host / cicd. Source does not supply cluster identity or expiry. Retained run only; missing is not proof it never ran.' }]
  const base = { version: 1 as const, id: JSON.stringify(['run-report', pipeline, name, data.as_of, receivedAt]), capturedAt: receivedAt, scope: `Current Platform host / cicd / ${pipeline} / ${name}`, evidence }
  if (!run) return { ...base, panels: [{ id: 'run', label: 'Run record', blocks: [{ kind: 'note', text: 'Requested run not represented in this response. History and current state are unknown.' }] }], objects: {} }
  const seen = new Set<string>()
  for (const t of run.tasks) {
    if (!t.name || seen.has(t.name) || !Array.isArray(t.steps) || !Array.isArray(t.results)) throw new Error('incomplete or duplicate task identity')
    seen.add(t.name)
  }
  const taskKey = (task: string) => JSON.stringify(['task-run', 'cicd', name, task])
  return { ...base, panels: [{ id: 'run', label: 'Run record', blocks: [
    { kind: 'facts', rows: [['Run', run.name], ['Pipeline', run.pipeline], ['Input revision', run.revision ?? missing], ['Status', run.status], ['Reason', run.reason ?? missing], ['Created at', run.created_at], ['Started at', run.start_time ?? missing], ['Completed at', run.completion_time ?? missing], ['Trigger', run.trigger ?? missing]].map(([label, value]) => ({ label, value })) },
    { kind: 'note', text: 'Results and tasks belong to this run. Input revision and output commit remain separate. Task order is not a dependency graph; overlapping durations are not added. A successful run is not evidence of current deployment.' },
    resultsBlock(run.results),
    { kind: 'table', head: ['Task run', 'Task', 'Status', 'Created at', 'Finished at'].map(label => ({ label })), rows: run.tasks.map(t => ({ key: taskKey(t.name), open: taskKey(t.name), cells: [t.name, t.task, t.status, t.created_at ?? missing, t.finished_at ?? missing] })), empty: 'No task records retained.' },
    { kind: 'note', text: `Skipped tasks reported by source: ${run.skipped?.join(', ') || 'None supplied'}` },
  ] }], objects: Object.fromEntries(run.tasks.map(t => [taskKey(t.name), { label: t.name, evidence, blocks: [
    { kind: 'facts', rows: [{ label: 'Parent run', value: name }, { label: 'Task', value: t.task }, { label: 'Status', value: t.status }] },
    { kind: 'table', head: ['Step', 'Status', 'Started at', 'Finished at', 'Exit code'].map(label => ({ label })), rows: t.steps.map((s, i) => ({ key: String(i), cells: [s.name, s.status, s.started_at ?? missing, s.finished_at ?? missing, s.exit_code ?? missing] })), empty: 'No step timestamps retained.' },
    resultsBlock(t.results),
  ] }])) }
}

export function runLogReport(data: LogsResponse, name: string, receivedAt: string): ObservationReport {
  if (data.run_name !== name || data.namespace !== 'cicd') throw new Error('source identity does not match the requested run')
  const evidence: ReadEvidence[] = [{ source: `/api/v1/delivery/runs/${encodeURIComponent(name)}/logs?ns=cicd`, receivedAt, evaluatedAt: data.generated_at, outcome: 'read', detail: 'Independent log-tail read. Per-container failures may appear in the text. No expiry or full-history guarantee.' }]
  return { version: 1, id: JSON.stringify(['run-logs', data.cluster_id, 'cicd', name, data.generated_at, receivedAt]), capturedAt: receivedAt,
    scope: `${data.cluster_id} / cicd / ${name} / log tail`, evidence, objects: {}, panels: [{ id: 'logs', label: 'Run log evidence', blocks: [
      { kind: 'facts', rows: [{ label: 'Run', value: name }, { label: 'Last log at', value: data.last_log_at ?? missing }] },
      { kind: 'note', text: data.logs || 'No log text supplied; not proof that the run never executed.' },
    ] }] }
}

export type ReportQuery = { kind: 'pipeline'; pipeline: string } | { kind: 'run'; pipeline: string; run: string } | { kind: 'logs'; run: string }
export function reportQueryOf(url: URL): ReportQuery | { error: string } {
  const kind = url.searchParams.get('kind'), pipeline = url.searchParams.get('pipeline') ?? '', run = url.searchParams.get('run') ?? ''
  const bad = (what: string) => ({ error: `${what} must be a pipeline or run name` })
  if (kind === 'pipeline') return NAME.test(pipeline) ? { kind, pipeline } : bad('pipeline')
  if (kind === 'run') return !NAME.test(pipeline) ? bad('pipeline') : !NAME.test(run) ? bad('run') : { kind, pipeline, run }
  if (kind === 'logs') return NAME.test(run) ? { kind, run } : bad('run')
  return { error: 'kind must be pipeline, run or logs' }
}

export async function readReport(up: Upstream, authorization: string | undefined, q: ReportQuery): Promise<Envelope<ObservationReport>> {
  const path = q.kind === 'pipeline' ? `/api/v1/delivery/pipelines/${encodeURIComponent(q.pipeline)}/runs`
    : q.kind === 'run' ? timingsPath(q.pipeline, q.run) : `/api/v1/delivery/runs/${encodeURIComponent(q.run)}/logs?ns=cicd`
  const r = await readAs<Record<string, unknown>>(up, path, authorization)
  const ev: ReadEvidence = { ...r.evidence, source: path }
  if (ev.outcome !== 'read') return envelope<ObservationReport>('report', [ev], null)
  const fail = (detail: string) => envelope<ObservationReport>('report', [{ ...ev, outcome: 'error', detail }], null)
  const b = r.body
  try {
    if (q.kind === 'pipeline') {
      if (!b || !Array.isArray(b.runs)) return fail('incomplete answer: no runs list; the runs are not known')
      return envelope('report', [ev], pipelineReport(b as unknown as RunsResponse, ev.receivedAt))
    }
    if (q.kind === 'run') {
      if (!b || !Array.isArray(b.runs) || !(b.runs as TimingRun[]).every(x => Array.isArray(x.tasks) && Array.isArray(x.results))) return fail('incomplete answer: the run record is not known')
      return envelope('report', [ev], runReport(b as unknown as Timings, q.pipeline, q.run, ev.receivedAt))
    }
    if (!b || typeof b.logs !== 'string') return fail('incomplete answer: no log text field')
    return envelope('report', [ev], runLogReport(b as unknown as LogsResponse, q.run, ev.receivedAt))
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e))
  }
}
