# Shared observation context v1

Import `useObservationContext` from `@bifrost/ui/city/observationContext`.
The host supplies an immutable `ObservationSnapshot` v1. Mount the hook above
view navigation and pass its `snapshot` and `context` to existing `ObservationView`
projections. It owns only selected path, measurement visibility, observation time,
and an optional pinned snapshot reference. It creates no store, history, transport,
message consumer, health judgment or action permission.

`useObservationContext(latest, initialSelection?)` returns:

- `snapshot`: the supplied latest snapshot or the retained pinned reference.
- `latest`: the current host input, even while pinned.
- `context`: the existing `{selected, metrics, at}` model shared by every view.
- `pinned`, `select(path)`, `setMetrics(boolean)`, `pin()`, `resume()`.

`pin()` captures the latest complete snapshot reference and the observation time
at the click. Source measurement/evaluation/receipt timestamps are unchanged.
The pinned observation time is not the backend capture time and is not a claim
that a source was fresh when pinned. `resume()` keeps selection and immediately
uses current input/time. Selecting an absent object retains its identity: the
consumer must explain absence, never silently select another object.

There is exactly one retained pin; re-pinning replaces it. Live time ticks once a
second; pinning and unmounting clear that timer. Background acquisition is owned
by the host and continues independently. No localStorage/sessionStorage writes.
Unmount/reload loses the pin. A URL with an old timestamp cannot recreate it.

Host responsibilities: keep this hook mounted for in-app navigation; remount it
at authentication/data-scope boundaries so a prior identity's pin is not reused;
pass the same context to all projections; never mutate supplied snapshots.
Cross-product selection requires an explicit identity mapping. Navigation/menu
and permissions stay with the host. This module does not change uncontrolled
ObservationSurface or RuntimeWorld props; their owners can add opt-in controlled
consumption separately. Pure readingView/statusView already accept this context.

Rollback: remove the opt-in consumer/import. No persisted state or backend changes.

## The journey bar's time and reference (0.45.0)

The hook also returns `time` (the world's one time model, `WorldTime` from
`@bifrost/ui/city/world`) and `ref` (the selection as a typed reference,
`{kind: 'place', key: pathKey(selected)}`). Pass `time` straight to
`WorldFrame`'s time chip: live carries the newest time any source gave for its
reading (evaluated, else received; none means not known, never the render
time); pinned carries the snapshot's capture time and the moment the viewer
pinned it. Console stays live while Signals holds a pin; it may say so in its
context line, never show Signals' pinned time as its own. `worldTimeOf` and
`placeRef` are the same, as pure functions. Additive: existing consumers are
unchanged.
