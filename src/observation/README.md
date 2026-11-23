# ObservationSurface v1

Opt-in entry: `@bifrost/ui/city/observation` (existing wildcard export). Package version 0.29.1; CityContent v2 and its existing readers are unchanged.

The caller owns acquisition and passes immutable `ObservationSnapshot` values. `content` is the existing CityContent object, not a second object model. `evidence` uses encoded full Place paths; root is the empty string. Evidence distinguishes response receipt from Prometheus evaluation time. Expiry is supplied by the adapter and describes display freshness, never hardware health. Missing time or source stays unknown.

`views` and `layers` register pure `present(snapshot, context)` projections into the existing CardView block grammar. They must not acquire data or perform actions. Default main views are Readings and Status field. Metrics visibility, enabled layers, selected path, pinned snapshot reference and skin belong to the surface. All presentations receive the same snapshot and context. Pinning does not stop the caller. There is no event bus, history database, acknowledgement or approval API here.

Optional `layerPanels` accepts data already projected by another contract owner, such as CommunicationSnapshot v1. Capture it alongside the snapshot so a pinned view cannot drift into live communication. Retain stage names and original evidence; missing workflow stages are not inferred. A layer without a supported identity mapping must say it is unplaced. This surface does not create mappings or infer worker activity.

Old City and Ledger entry points do not need to migrate. Future wiring should pass the existing shared acquisition result to this surface, not mount another subscriber per view/layer. This slice pins the current response; it does not reconstruct historical ranges.

Revert the additive observation entry/module and version fields to remove the feature. No previous renderer is changed. The package includes the landed communication contract; observations consume it without changing its semantics.

## Signals scene

`RuntimeWorld` is the opt-in game presentation of the same ObservationSnapshot.
Its optional links are supplied by the host. It uses the existing Phaser engine
with Canvas rendering, no WebGL context, no ambient animation, and a 20 fps cap
while handling input. The loop sleeps after 150 ms idle and while hidden; new
snapshots or input wake it. Unmount removes listeners/timers and wakes the loop
before Phaser's deferred destruction. Acquisition is owned by the caller and
is not affected by render sleep or layer switches. Missing/stale quality never
gets the fresh online accent. Geometry is presentation, not claimed topology.
