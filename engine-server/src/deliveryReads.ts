import { INT, NAME, type Reads } from './allowlist.ts'

/**
 * Step 7a (engine backend plan, 2026-11-23; 箭10 2026-11-24): the release and delivery pages' reads (Releases, the
 * delivery panels, release window, PROD judgements, release policy, Argo CD, audit, delivery stages). Their Console
 * readers are thin, so they are a declared list (allowlist.ts) at GET /engine/v1/delivery?read=<name>. Writes on these
 * pages (start a run, hold or clear the window, roll an app back, approve) are not reads and stay on the platform's
 * front door. The run reports of step 6 (/engine/v1/report) cover the runs, timings and logs.
 */
const REPO = /^[a-z0-9][a-z0-9_-]{0,63}$/
const REF = /^[A-Za-z0-9._/-]{1,128}$/
const SHA = /^[0-9a-f]{7,40}$/

export const READS: Reads = {
  'pipelines': { path: '/api/v1/delivery/pipelines' },
  'release-window': { path: '/api/v1/delivery/release-window' },
  'supply-chain': { path: '/api/v1/delivery/supply-chain' },
  'compare': { path: '/api/v1/delivery/compare', params: { repo: { re: REPO, required: true }, from: { re: REF, required: true }, to: { re: REF, required: true } } },
  'stg-smoke': { path: '/api/v1/delivery/stg/smoke' },
  'prod-judgements': { path: '/api/v1/delivery/prod-judgements', params: { limit: { re: INT(100) } } },
  'releases': { path: '/api/v1/releases', params: { limit: { re: INT(1000) } } },
  'running-images': { path: '/api/v1/releases/running-images' },
  'release-policy': { path: '/api/v1/release-policy' },
  'gitops-apps': { path: '/api/v1/gitops/apps' },
  'audit': { path: '/api/v1/audit' },
  'stages': { path: '/api/v1/agentrt/delivery', params: { commit: { re: SHA } , view: { re: /^(configuration|boundaries)$/ }, key: { re: NAME }, value: { re: REF } } },
}
