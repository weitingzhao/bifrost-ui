/*
 * One change's way from a branch to PROD, as one lane (箭10 2026-11-24, the delivery lane, step 2: Owner wants the CI
 * runs and the Gitea lineage on one page, one Change-Id one lane). The shape is the engine's
 * GET /engine/v1/delivery/lanes v1 (UI / Engine's field table, cockpit/ui-engine/delivery-lanes-fields.md): every lane
 * carries all eleven cells in a fixed order, each judged by the engine; the view draws them and judges nothing.
 */

/** The engine's words for a cell (a subset of the seven; the engine judges, the view does not). */
export type LaneWord = 'ok' | 'warn' | 'fail' | 'pending' | 'unknown'

/** The eleven cells, in this order; window, judgement and approval are gates. */
export const LANE_STAGES = ['branch', 'dev', 'ready', 'ci', 'land', 'main', 'window', 'stg', 'judgement', 'approval', 'prod'] as const
export type LaneStageKey = (typeof LANE_STAGES)[number]

export type LaneStage = {
  key: LaneStageKey
  kind: 'step' | 'gate'
  status: LaneWord
  at: string | null
  /** The source's own words: why refused, which task failed, why unknown. */
  reason: string | null
  run: string | null
  /** Runs this cell had; more than one means the change was sent back and pushed again. */
  attempts: number
  /** Where the Console shows it (an in-app address), or null. */
  link: string | null
}

export type DeliveryLane = {
  /** The Change-Id; a refused land run with no Change-Id is `sha:<40 hex>`. */
  id: string
  changeId: string | null
  repo: string
  subject: string | null
  session: string | null
  title: string | null
  /** The lane as it stands, the engine's word (any fail makes it fail). */
  status: LaneWord
  /** Stopped at fail or warn, or pending for more than 30 minutes. */
  stuck: boolean
  updatedAt: string
  stages: LaneStage[]
}

/** One upstream read the engine made; one not reached leaves the cells that depend on it unknown. */
export type LaneSource = { name: string; reached: boolean; status?: number; reason?: string }

export type DeliveryLanesData = { lanes: DeliveryLane[]; sources: LaneSource[]; oldestRun: string | null }

export const STAGE_LABEL: Record<LaneStageKey, string> = {
  branch: 'Branched from main', dev: 'Develop', ready: 'Pushed ready/', ci: 'Checks', land: 'Land', main: 'On main',
  window: 'Release window', stg: 'STG', judgement: 'PROD judgement', approval: 'Waiting on the Owner', prod: 'PROD',
}
