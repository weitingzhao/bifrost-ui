# ObservationSurface v1

Opt-in entry: `@bifrost/ui/city/observation` (existing wildcard export). Package version 0.25.0; CityContent v2 and its existing readers are unchanged.

The caller owns acquisition and passes immutable `ObservationSnapshot` values. `content` is the existing CityContent object, not a second object model. `evidence` uses encoded full Place paths; root is the empty string. Evidence distinguishes response receipt from Prometheus evaluation time. Expiry is supplied by the adapter and describes display freshness, never hardware health. Missing time or source stays unknown.

`views` and `layers` register pure `present(snapshot, context)` projections into the existing CardView block grammar. They must not acquire data or perform actions. Default main views are Readings and Status field. Metrics visibility, enabled layers, selected path, pinned snapshot reference and skin belong to the surface. All presentations receive the same snapshot and context. Pinning does not stop the caller. There is no event bus, history database, acknowledgement or approval API here.

Optional `layerPanels` accepts data already projected by another contract owner, such as CommunicationSnapshot v1. Capture it alongside the snapshot so a pinned view cannot drift into live communication. Retain stage names and original evidence; missing workflow stages are not inferred. A layer without a supported identity mapping must say it is unplaced. This surface does not create mappings or infer worker activity.

Old City and Ledger entry points do not need to migrate. Future wiring should pass the existing shared acquisition result to this surface, not mount another subscriber per view/layer. This slice pins the current response; it does not reconstruct historical ranges.

Revert the additive observation entry/module and version fields to remove the feature. No previous renderer is changed. The 0.25.0 version is a local branch proposal; coordinate only the version fields with the communication owner's in-flight 0.24.0 package change before publishing either combined package.
