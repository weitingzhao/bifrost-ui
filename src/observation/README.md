# ObservationSurface v1

Opt-in entry: `@bifrost/ui/city/observation` (existing wildcard export). Package version 0.31.1; CityContent v2 and its existing readers are unchanged.

The caller owns acquisition and passes immutable `ObservationSnapshot` values. `content` is the existing CityContent object, not a second object model. `evidence` uses encoded full Place paths; root is the empty string. Evidence distinguishes response receipt from Prometheus evaluation time. Expiry is supplied by the adapter and describes display freshness, never hardware health. Missing time or source stays unknown.

`views` and `layers` register pure `present(snapshot, context)` projections into the existing CardView block grammar. They must not acquire data or perform actions. Default main views are Readings and Status field. Metrics visibility, enabled layers, selected path, pinned snapshot reference and skin belong to the surface. All presentations receive the same snapshot and context. Pinning does not stop the caller. There is no event bus, history database, acknowledgement or approval API here.

Optional `layerPanels` accepts data already projected by another contract owner, such as CommunicationSnapshot v1. Capture it alongside the snapshot so a pinned view cannot drift into live communication. Retain stage names and original evidence; missing workflow stages are not inferred. A layer without a supported identity mapping must say it is unplaced. This surface does not create mappings or infer worker activity.

Old City and Ledger entry points do not need to migrate. Future wiring should pass the existing shared acquisition result to this surface, not mount another subscriber per view/layer. This slice pins the current response; it does not reconstruct historical ranges.

Revert the additive observation entry/module and version fields to remove the feature. No previous renderer is changed. The package includes the landed communication contract; observations consume it without changing its semantics.

## Signals village

`RuntimeWorld` is the opt-in, single-page presentation of the same snapshot.
It composes `domains`, `ci`, `data` panels from the existing CardView grammar
and hardware from CityContent. No public schema or acquisition interface changes.
Every region is visible without changing tabs; a narrow screen scrolls the same page.
Core facts stay visible. Long explanations are compact signs; evidence opens the
complete source text and timestamps. Selection and pinning share one snapshot.

The buildings reuse City's `districtHall`, `workshop`, drawing kit and palette.
The SVG textures are static: no Phaser instance, canvas, animation frame loop or
GPU context is needed for this overview. A 15-second display clock only updates
freshness labels; caller-owned reads continue independently. No implied people,
activity, geographical positions or network edges are drawn.

Rollback this UI commit with its consumer commit; backend state is unchanged.

## Controlled Signals (0.34.0)

RuntimeWorld accepts either `snapshot` (existing standalone mode) or
`observation` (the exact return value of the public
`useObservationContext` hook), never both. Controlled mode owns no pin,
selection, measurement state or clock. Pin/resume/select/setMetrics buttons
call the host operations. Standalone mode mounts that same public hook once.
A fixed context stops its clock; acquisition is not stopped.

Keep the host hook above route changes and supply the complete composite
ObservationSnapshot, including layerPanels and evidence. Do not give Signals
a hardware-only snapshot and expect its domain/CI/data panels to survive pinning.
A reload or host unmount loses the pin; a timestamp cannot reconstruct it.
Missing selected Paths stay selected and display an explicit notice.

Alert visibility, evidence drawer open state and source-panel ID remain local
presentation state; this API does not promise to restore them across navigation.
Source-panel IDs are not hardware Paths. World navigation must not invent that
mapping. Inputs are immutable snapshots; no backend write is performed.

## Workload yard (0.38.0)

Optional fifth region, rendered only when the host supplies `layerPanels.workloads`
(one panel per namespace, CardView blocks). Hosts that do not supply it keep four
regions; no prop or schema change. The panels are the host's projection of other
lines' public reads (bus states, the evaluation readout); this module draws them
and judges nothing. Rollback: revert this commit; older hosts are unaffected.

## World frame (0.41.0)

`RuntimeWorld` takes an optional `frame` (`RuntimeWorldFrame`: the other places'
`hrefs`, `env`, `identity`). Given, the scene wears the engine's `WorldFrame` in place
of its own BIFROST / SIGNALS kicker and place links: crumbs `Signals › <selected>`,
time chip live or pinned at the shown snapshot's `capturedAt`, the alerts corner from
the snapshot's own alert read (City's rule: firing, severity none left out; not read is
not 0) opening the alert evidence, and row 2 the observation line. Without `frame`
nothing changes. Rollback: drop the prop on the host.

0.46.0: the frame's time chip takes the shared context's `time` (WorldTime, 0.45.0):
live shows the newest time a source gave for its reading, not the snapshot's capture
or render time; pinned shows the snapshot's capture time.

0.48.0: `ObservationPanel.glyph` (optional) names a world glyph the content chose for
the panel's subject; the village draws it on the panel's name plate (brand layer
item 6: the same domain wears the same glyph on every view). The engine still knows
no domains: the host's table says which glyph stands for which domain.

0.52.0: status words (brand layer item 5). A reading's quality on the evidence buttons
and a device's place state are shown as the Ops seven words through the engine's one
table (statusOfQuality, statusOfState); the original words stay in the tooltip, the
small text beside the word and the evidence drawer. ok carries no colour, as in CardView.

0.56.0: brand layer, three items. The body under the frame fades in (150 ms, none when
motion is reduced), as City and Agents. `RuntimeWorldFrame` also takes `back` (the
journey's previous stop) and passes it to WorldFrame's Return slot. The scene's
interface parts (page ground, text, buttons, section numbers, evidence drawer) take
the host's tokens (--background, --foreground, --muted, --border, --card, --ring) and
the engine's mono font; the pixel cards and their ground stay (genre layer).

0.59.1: 390-wide sweep (箭10 2026-11-24, as cockpit/ui-console/sweep-390.md). A device
row's label keeps its word whole and the value wraps beside it, right-aligned: at two
cards a row the label "Memory" was broken into "Memor / y". No page or drawer
overflowed at 390.
