# Ledger reading projections

Opt-in shared rendering; no transport, cache, persistence, health calculation or workflow commands.

Public entry: `@bifrost/ui/city/ledger` (existing city wildcard export; implementation lives in `src/ledger`).

- `LedgerGrid({table, selected, onSelect, scope})` accepts an existing static `Block` table. A dimension supplies its own columns, values, identities and evidence semantics. Source functions are not accepted. Local filtering and 50-row paging only cover supplied rows; the UI discloses counts and does not assert upstream completeness. Sorting uses displayed text (numeric for actual numeric cells), without unit conversion or aggregation. `onSelect` is a local navigation callback; hosts must not attach business actions.
- `LedgerEvidence({snapshot, context})` is the ObservationSnapshot v1 adapter. It reuses the public readingView cell values; source outcome and timestamps are displayed verbatim. Other dimensions retain their own detail adapters rather than being coerced into hardware fields.
- The host owns snapshot, context time and selected identity; keep them above carrier switches. Components never reconstruct or persist a historical snapshot. Missing selected objects remain explicit. Filtering/paging does not clear selection.
- CardView remains the renderer. No changes to CityLedger, communication Ledger, Signals ObservationSurface or Console HardwareEvidence.

The independent consumer is Platform `console/ledger-preview.html`, served only by an isolated bdev session. Its data comes from the existing `useHardwareObservation` public hook, not a new acquisition path. It consumes the public engine useObservationContext for one fixed snapshot/time and selection shared by both carriers. Incoming reads continue while fixed; resume returns to the newest supplied snapshot without clearing selection. Reload cannot reconstruct the old snapshot. No historical report is offered.

Validation lives in Platform `console/src/domains/foundation/ledger/__tests__/ledger.test.tsx`, reusing the existing explicitly simulated quality fixture. The 5000-row case verifies DOM bounds, not unbounded acquisition or long-term performance. All supplied rows are still held and filtered in memory; server pagination/virtualization should be supplied by the host when needed, never silently assumed.

Ledger is additive in 0.33.0. The example also consumes the engine observation-context API introduced in 0.32.0. Release and deployment status are recorded by the host delivery process; a source version alone does not establish a running deployment.
