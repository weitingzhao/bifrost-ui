# bifrost-engine (lodging in bifrost-ui/engine-server)

**Temporary home.** The Owner, 2026-11-23 (via 箭10): until its own repository exists (repository creation is being
made an automated card), the engine backend lives here, isolated in code, and moves out whole. Rules that keep the move
a `git mv`, held by `test/boundary.test.ts`:
- it imports only itself, `node:*`, and the engine's contract types from `../../src/observation/model.ts`, type-only
  (erased at run time; no bundling, no runtime dependency on bifrost-ui);
- bifrost-ui's `src` never imports it; it is not in bifrost-ui's `tsconfig` include or its published `files`;
- it has its own `package.json`, tests and Dockerfile; bifrost-ui's `npm test` does not run it (run it here).

Moving out (Foundation's R0C verdict, 2026-11-23, biz-align/r0c-engine-verdict-2026-11-23.md: its own repository,
shared tier, **not public**: not in gitea-primary, not followed to GitHub; registry row
`{name: bifrost-engine, tier: shared, domain: owner, public: false, ready: true}`):
1. The CI line's template script exists; the Owner creates `bifrost/bifrost-engine` from repo-template in Gitea and
   approves one branch-protection card; the registry row is added and the pipeline generated.
2. `git subtree split -P engine-server -b engine-export` in bifrost-ui (keeps this directory's history), push that branch
   as the new repository's main.
3. In the new repository, replace the contract import with the published package: add `@bifrost/ui` as a dev dependency
   and import the type from `@bifrost/ui/city/observation`; update the boundary test's allowed import.
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

Run (from this directory): `npm start` (Node ≥ 22.18, TypeScript by type stripping; `PLATFORM_API_URL`, default `http://platform-api:8780`;
`PORT`, default 8796). Test: `npm test`. Typecheck: `npm run typecheck`.

Plan and ledger: the UI / Engine line (cockpit/ui-engine in the shared notes).

| `GET /engine/v1/domains` | the domains' four lights and the map's inventory, as the platform's last scan kept them (unjudged) | `/api/v1/catalog/status` |

Step 1's check: `PLATFORM=… ENGINE=… COMPARE_TOKEN=… node scripts/compare-domains.ts` reads both in the same minute and
compares every domain's lights; exit 0 only when equal and from the same scan round.
