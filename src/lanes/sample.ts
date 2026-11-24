import { LANE_STAGES, type DeliveryLane, type DeliveryLanesData, type LaneStage, type LaneStageKey } from './model'

/**
 * SAMPLE LANES — invented, for previews and tests only; never shown as the system's state. The real lanes are the
 * engine's GET /engine/v1/delivery/lanes. Shapes from the engine's measure (cockpit/ui-engine/delivery-lanes-measure.md):
 * one reached PROD; one refused at land and pushed again, now checking; one past STG whose PROD is unknown because the
 * delivery failed after pushing its images and whose PROD release waits for the Owner; one older than the kept runs.
 * Words as the engine (7cfc228) sends them: a run in progress is info, a stage not reached yet boundary, never pending;
 * each lane's status is its worst cell, so a lane that reached PROD through gates on their own cadence reads boundary.
 */
type Cell = Partial<Omit<LaneStage, 'key' | 'kind'>>
const GATES: LaneStageKey[] = ['window', 'judgement', 'approval']
function stages(cells: Partial<Record<LaneStageKey, Cell>>): LaneStage[] {
  return LANE_STAGES.map(key => ({
    key, kind: GATES.includes(key) ? 'gate' : 'step', status: 'unknown', at: null, reason: null, run: null, attempts: 0, link: null,
    ...(key === 'approval' ? { status: 'boundary' as const, reason: 'the signed rule releases platform; no card' } : {}),
    ...(key === 'window' ? { status: 'boundary' as const, reason: 'the window keeps no history per change' } : {}),
    ...cells[key],
  }))
}

export const SAMPLE_LANES: DeliveryLane[] = [
  {
    id: 'I1111aaaa2222bbbb3333cccc4444dddd5555eeee', changeId: 'I1111aaaa2222bbbb3333cccc4444dddd5555eeee', repo: 'bifrost-platform',
    subject: 'Sample: the audit table reads every kept record', session: 'local_sample1', title: 'Sample thread', status: 'boundary', stuck: false,
    updatedAt: '2026-11-24T05:10:00Z',
    stages: stages({
      branch: { status: 'ok', at: '2026-11-24T03:58:00Z' }, dev: { status: 'ok', at: '2026-11-24T04:05:00Z' },
      ready: { status: 'ok', at: '2026-11-24T04:20:00Z' },
      ci: { status: 'ok', at: '2026-11-24T04:24:00Z', run: 'ci-platform-sample1', attempts: 1, link: '#delivery/run/ci-platform-sample1' },
      land: { status: 'ok', at: '2026-11-24T04:30:00Z', run: 'land-sample1', attempts: 1 },
      main: { status: 'ok', at: '2026-11-24T04:31:00Z' },
      stg: { status: 'ok', at: '2026-11-24T04:35:00Z', run: 'bifrost-deliver-platform-sample1', attempts: 1 },
      judgement: { status: 'ok', at: '2026-11-24T05:02:00Z', reason: 'the signed rule covered this range', run: 'judgement-sample1' },
      prod: { status: 'ok', at: '2026-11-24T05:10:00Z', run: 'bifrost-deliver-platform-prod-sample1', attempts: 1 },
    }),
  },
  {
    id: 'I2222bbbb3333cccc4444dddd5555eeee6666ffff', changeId: 'I2222bbbb3333cccc4444dddd5555eeee6666ffff', repo: 'bifrost-platform',
    subject: 'Sample: the run list filters failed runs', session: 'local_sample2', title: 'Sample thread', status: 'info', stuck: false,
    updatedAt: '2026-11-24T06:12:00Z',
    stages: stages({
      branch: { status: 'ok', at: '2026-11-24T05:20:00Z' }, dev: { status: 'ok', at: '2026-11-24T05:40:00Z' },
      ready: { status: 'ok', at: '2026-11-24T06:06:00Z', attempts: 2 },
      ci: { status: 'ok', at: '2026-11-24T06:10:00Z', run: 'ci-platform-sample3', attempts: 2 },
      land: { status: 'info', at: '2026-11-24T06:12:00Z', run: 'land-sample3', attempts: 2,
        reason: 'previous attempt refused: the branch is behind main and Gitea could not rebase it (409)' },
      main: { status: 'boundary', reason: 'not reached yet' }, stg: { status: 'boundary', reason: 'not reached yet' },
      judgement: { status: 'boundary', reason: 'not reached yet' }, prod: { status: 'boundary', reason: 'not reached yet' },
    }),
  },
  {
    id: 'I3333cccc4444dddd5555eeee6666ffff7777aaaa', changeId: 'I3333cccc4444dddd5555eeee6666ffff7777aaaa', repo: 'bifrost-platform',
    subject: 'Sample: PROD delivery failed after its images were pushed', session: 'local_sample3', title: 'Sample thread', status: 'unknown', stuck: true,
    updatedAt: '2026-11-24T07:20:00Z',
    stages: stages({
      branch: { status: 'ok', at: '2026-11-24T06:20:00Z' }, dev: { status: 'ok', at: '2026-11-24T06:40:00Z' },
      ready: { status: 'ok', at: '2026-11-24T06:50:00Z' },
      ci: { status: 'ok', at: '2026-11-24T06:54:00Z', run: 'ci-platform-sample4', attempts: 1 },
      land: { status: 'ok', at: '2026-11-24T06:58:00Z', run: 'land-sample4', attempts: 1 },
      main: { status: 'ok', at: '2026-11-24T06:59:00Z' },
      stg: { status: 'ok', at: '2026-11-24T07:03:00Z', run: 'bifrost-deliver-platform-sample4', attempts: 1 },
      judgement: { status: 'boundary', at: '2026-11-24T07:10:00Z', reason: 'the signed rule held this range: a card is needed' },
      approval: { status: 'info', at: '2026-11-24T07:12:00Z', reason: 'a release card waits for the Owner', waiting: 'action', link: '#command?section=actions' },
      prod: { status: 'unknown', at: '2026-11-24T07:20:00Z', run: 'bifrost-deliver-platform-prod-sample4', attempts: 1,
        reason: 'images pushed, then gitops-sync failed: whether PROD runs it is not known' },
    }),
  },
  {
    id: 'I4444dddd5555eeee6666ffff7777aaaa8888bbbb', changeId: 'I4444dddd5555eeee6666ffff7777aaaa8888bbbb', repo: 'bifrost-ui',
    subject: 'Sample: an older change whose runs were cleaned', session: null, title: null, status: 'unknown', stuck: false,
    updatedAt: '2026-11-22T10:00:00Z',
    stages: stages({
      branch: { status: 'ok', at: '2026-11-22T08:00:00Z' }, dev: { status: 'ok', at: '2026-11-22T08:30:00Z' },
      ready: { status: 'unknown', reason: 'the ready/ branch is gone' },
      ci: { status: 'unknown', reason: 'runs cleaned (kept about one day)' }, land: { status: 'unknown', reason: 'runs cleaned (kept about one day)' },
      main: { status: 'ok', at: '2026-11-22T09:10:00Z' },
      stg: { status: 'ok', at: '2026-11-22T09:40:00Z' }, prod: { status: 'ok', at: '2026-11-22T10:00:00Z' },
    }),
  },
]

export const SAMPLE_LANES_DATA: DeliveryLanesData = {
  lanes: SAMPLE_LANES,
  sources: [
    { name: 'lineage', reached: true }, { name: 'land', reached: true }, { name: 'ci-bifrost-platform', reached: true },
    { name: 'prod-judgements', reached: false, status: 503, reason: 'sample: not reachable' },
  ],
  oldestRun: '2026-11-23T13:30:00Z',
}
