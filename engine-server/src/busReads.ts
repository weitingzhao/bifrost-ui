import { INT, type Reads } from './allowlist.ts'

/**
 * Step 7b (engine backend plan, 2026-11-23; 箭10 2026-11-24): the bus page's reads (Bus, the nerve view, known
 * regressions, the bus's state reads). Their Console readers are thin, so they are a declared list (allowlist.ts) at
 * GET /engine/v1/bus?read=<name>. The live stream is step 4 (/engine/v1/traffic); the event replay here is a page of
 * the past only (`wait=0`, never a long poll) under the Console's reader name. Writes on the bus (publishing,
 * recording a regression, marking it fixed) are not reads and stay on the platform's front door.
 */
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/
const ID = /^[A-Za-z0-9._:-]{1,128}$/
const REPO = /^[a-z0-9][a-z0-9_-]{0,63}$/
const TYPE = /^[a-z0-9][a-z0-9._-]{0,127}$/

export const READS: Reads = {
  'nextgen': { path: '/api/v1/bus/nextgen' },
  'contract': { path: '/api/v1/bus/contract' },
  'observe': { path: '/api/v1/bus/observe', params: { hours: { re: INT(720) } } },
  'clients': { path: '/api/v1/bus/clients', params: { hours: { re: INT(720) } } },
  'problems': { path: '/api/v1/bus/problems' },
  'effect': { path: '/api/v1/bus/effect' },
  'trace': { path: '/api/v1/bus/trace', params: { id: { re: ID, required: true } } },
  'events': { path: '/api/v1/bus/events', params: { since: { re: ISO, required: true }, limit: { re: INT(500) }, wait: { re: /^0$/, required: true }, receipts: { re: /^1$/ }, client: { re: /^console$/, required: true } } },
  'regressions': { path: '/api/v1/bus/regressions', params: { repo: { re: REPO }, open: { re: /^1$/ } } },
  'states': { path: '/api/v1/bus/states', params: { type: { re: TYPE, required: true } } },
  'evaluation': { path: '/api/v1/readings/evaluation', params: { days: { re: INT(90) }, name: { re: TYPE } } },
}
