# bifrost-engine (lodging in bifrost-ui/engine-server)

**Temporary home.** The Owner, 2026-11-23 (via 箭10): until its own repository exists (repository creation is being
made an automated card), the engine backend lives here, isolated in code, and moves out whole. Rules that keep the move
a `git mv`, held by `test/boundary.test.ts`:
- it imports only itself, `node:*`, the engine's contract types from `../../src/observation/model.ts`, type-only
  (erased at run time), and one runtime contract, `../../src/communication/model.ts` (step 5: the projection is the
  views' own function, never a copy), which must import nothing;
- so while it lodges here the image cannot be built from this directory alone (the communication model sits outside
  it); deployment waits for the move anyway, and the move replaces both with the published `@bifrost/ui` package;
- bifrost-ui's `src` never imports it; it is not in bifrost-ui's `tsconfig` include or its published `files`;
- it has its own `package.json`, tests and Dockerfile; bifrost-ui's `npm test` does not run it (run it here).

Moving out (Foundation's R0C verdict, 2026-11-23, biz-align/r0c-engine-verdict-2026-11-23.md: its own repository,
shared tier, **not public**: not in gitea-primary, not followed to GitHub; registry row
`{name: bifrost-engine, tier: shared, domain: owner, public: false, ready: true}`):
1. The CI line's template script exists; the Owner creates `bifrost/bifrost-engine` from repo-template in Gitea and
   approves one branch-protection card; the registry row is added and the pipeline generated.
2. `git subtree split -P engine-server -b engine-export` in bifrost-ui (keeps this directory's history), push that branch
   as the new repository's main.
3. In the new repository, replace the contract imports with the published package: add `@bifrost/ui` as a dependency,
   import the types from `@bifrost/ui/city/observation` and the communication model from `@bifrost/ui/communication`;
   update the boundary test's allowed imports.
4. Delete `engine-server/` from bifrost-ui in one commit naming the new repository; then step 0 of the plan (STG).


The UI engine's backend (charter 10 §6, the City engine's second generation). Every view (City, Signals, Agents,
Ledger, Console) reads through it; it reads the platform's public read routes server to server and answers with
engine models. Owner 2026-11-23: plan B, switched over one read at a time.

- **Reads only.** Any method but GET is refused. Writes go to the platform's own front door, never through here.
- **No credential of its own.** Each upstream read carries the viewer's own `Authorization` header unchanged, so the
  engine never sees more than the person looking. The header is never logged, cached by, or put in a URL.
- **Says what happened.** Every answer is the v1 envelope `{version, model, capturedAt, provenance, evidence, data}`;
  a refused or failed read is an `error` evidence with its reason, never empty data.
- **Who is looking, without keeping who they are.** Every answer carries `identity: {epoch, role}`: the epoch is an
  HMAC of the caller's token under a key drawn at start (same token, same epoch; another token, another; restart, all
  new); the role is what the platform's `/api/v1/auth/capabilities` says, kept a minute by epoch. A view drops all it
  holds of an old epoch (data, selection, pins) before showing a new one, and says "identity not ready" until its
  first answer.
- **API v1** under `/engine/v1/` (served at `ops.bifrost.lan/engine/`). v1 only grows fields; a breaking change is
  v2, served beside v1 for one release.

| Read | Model | Upstream |
|---|---|---|
| `GET /engine/v1/health` | engine version and commit, the platform's `/health` | `/health` |
| `GET /engine/v1/domains` | the domains' four lights and the map's inventory, as the platform's last scan kept them (unjudged) | `/api/v1/catalog/status` |
| `GET /engine/v1/hardware` | the platform's topology, every hardware query's series and the firing alerts, as they came; plus the join: each device with its keys (address, cluster node), its readings and its alerts; what names no device is kept as `unattached` | `/api/v1/topology?env=prod`, `/api/v1/telemetry/promql?q=…` (one per query in `config/hardware-queries.json`), `/api/v1/telemetry/alerts` |
| `GET /engine/v1/techtree?repo=` | who imports whom between domains at main, unchanged (`repo` defaults to `bifrost-platform`) | `/api/v1/ci/domains?repo=` |
| `GET /engine/v1/district?id=&repo=` | what one domain owns, unchanged (`holdings`), and its buildings' imports: the inner package imports rolled up to the map's buildings (`imports.edges`; a pair inside one building is no edge, one naming a package no building holds counts as `outside`; `read: false` with why when the tree is not read). Loops and Other are the view's drawing | `/api/v1/catalog/domain?id=`, `/api/v1/ci/domains?repo=` |
| `GET /engine/v1/traffic` (SSE) | the bus's deliveries as trips: `hello` (the bus contract read for this stream, its evidence, the identity), `trip` (one receipt: event type, reader, time, from the topic's domain to the reader's, null where the contract declares none; its SSE id is the cursor), `state` (live / denied / off / ended, with the reason); a heartbeat comment every 15 s. Resumes from the view's `Last-Event-ID`. The upstream reader name is `BUS_CLIENT` (default `console`, the Console's own: the switch replaces that reader, it adds none); its receipts are never trips | `/api/v1/bus/contract`, `/api/v1/bus/stream?client=&receipts=1` |
| `GET /engine/v1/communication?channel=&member=&through=&requested=&before=` | who talks to whom, evaluated here: time → channel → member → request with the views' own `projectCommunication`. Data `{scope, through, requested, resolved, state, exchanges (the window), members (all, not cut by scope), coverage {state, note, updatedAt, truncated, history {hasOlder, note}, scoped}}`. `channel` message (default) or event (event deliveries are on `/engine/v1/traffic` for now; the coverage says so); `member` an exact id; `before` reads letters before an event id. The crew roster is `config/roster.json` (the Console's snapshot until the switch) | `/api/v1/agentrt/events?types=…&limit=500`, `/api/v1/agent/threads`, `/api/v1/agentrt/seats`, `/api/v1/lineage?days=2` |
| `GET /engine/v1/report?kind=pipeline&pipeline=` · `kind=run&pipeline=&run=` · `kind=logs&run=` | an ObservationReport: a pipeline's retained runs (each openable); one run's record, tasks and steps; one run's log tail. The Console's delivery report projections, moved: status, revision and attempt identity are the delivery's; a source naming another run is an error | `/api/v1/delivery/pipelines/{p}/runs`, `/api/v1/delivery/pipelines/{p}/timings?run=`, `/api/v1/delivery/runs/{run}/logs?ns=cicd` |

Run (from this directory): `npm start` (Node ≥ 22.18, TypeScript by type stripping; `PLATFORM_API_URL`, default `http://platform-api:8780`;
`PORT`, default 8796; `BUS_CLIENT`, default `console`). Test: `npm test`. Typecheck: `npm run typecheck`.

Plan and ledger: the UI / Engine line (cockpit/ui-engine in the shared notes).

Checks (each reads the platform straight and through the engine in the same minute, with the same token, and exits 0
only when equal; run them in the Console's network after deploy, as the viewer, with `COMPARE_TOKEN`; never printed):
- Step 1: `PLATFORM=… ENGINE=… COMPARE_TOKEN=… node scripts/compare-domains.ts`
- Step 2: `PLATFORM=… ENGINE=… COMPARE_TOKEN=… node scripts/compare-hardware.ts`: devices; per query every series and
  value (a value that moved between two evaluation times asks for a rerun); per device its readings and alerts; the
  alerts. First run, 2026-11-24 against PROD (no token: these reads are open): 14 devices, 17 queries, differing 0.
- Step 3: `PLATFORM=… ENGINE=… COMPARE_TOKEN=… node scripts/compare-district.ts`: the tree's domains and edges; per
  domain its buildings, rows and building edges. Wants a viewer token (these reads refuse without one), so its first
  run is in the Console after deploy.
- Step 4: `PLATFORM=… ENGINE=… COMPARE_TOKEN=… [WINDOW_S=120] node scripts/compare-traffic.ts`: both streams over the
  same window, trip by trip (delivery, type, both ends); trips at the window's edges are reported apart; no traffic
  is "not measured", not a pass. Wants a viewer token.
- Step 5: `PLATFORM=… ENGINE=… COMPARE_TOKEN=… [CHANNEL=message] [MEMBER=thread:…] node scripts/compare-communication.ts`:
  the same cutoff on both sides, exchange by exchange (ends, every stage's evidence) and member by member. Wants a
  viewer token.
- Step 6: `PLATFORM=… ENGINE=… COMPARE_TOKEN=… [PIPELINES=a,b] node scripts/compare-report.ts`: every pipeline's run
  list and its newest run's record, panels and objects (report ids and capture times left out). First run, 2026-11-24
  against PROD without a token: 23 pipelines' run lists, differing 0; the 7 newest run records want a viewer token
  (not measured until then).

The hardware queries are configuration (`config/hardware-queries.json`), a copy of the Console's
`city/gen2/content/hardwareQueries.json` until the views switch; the switch deletes the Console's copy.

Step 1's check compares every domain's lights; it also wants both reads from the same scan round.
