# Communication contract v1

Public entry: `@bifrost/ui/communication` (package 0.24.0).
This is the first-generation in-process engine API. It adds no server, mailbox, or authority.

Adapters submit `CommunicationFact[]` and `Member[]`; `exchangesOf` and `membersOf`
produce the shared projection. Renderers consume `CommunicationSnapshot` version 1.
`WorkingStudio` receives the snapshot and an ornamental station image URL. It makes
no requests and performs no ACK, acceptance, reply, approval, or completion action.

## Evidence

Every fact has a source-unique `id`, a `communication` correlation ID, a `channel`
(message or event), a `stage`, and evidence (`id`, `source`, ISO timestamp `at`,
optional actor). Producers namespace fact IDs. Event and message correlation IDs
are separate namespaces. Repeated fact IDs are ignored; arrival order does not
imply workflow order. Producers must use the same correlation ID only when the
source explicitly links the records. Labels are descriptions, not state.

Stages are independent: sent, delivered, acknowledged, accepted, replied,
completed, audited. No stage creates another stage. A missing stage means not
observed in the supplied evidence, never rejection, failure, or inactivity.
A reply-like message type alone does not link a reply to an earlier message.

Membership is many-to-many: actor ID plus memberships containing organization,
nullable domain, seat, owner/temporary/human/outside role and optional inviter.
An unresolved actor remains visible with no invented membership. Activity is an
independent source-attributed observation; waiting for a message does not stop
an actor or establish its activity state.

`evidenceThrough` filters retained stage evidence only. Current membership and
activity are not historical reconstructions. Coverage carries loading/error,
last successful read, provenance and truncation. Consumers must retain those
qualifications. Themes and layouts do not modify these semantics.

## Boundaries and reuse

Platform vocabulary and transport remain in Platform adapters. The engine imports
no Platform code. Studio and Ledger render the same snapshot. City consumes the
shared Platform `busFacts` projection for its existing trips; its geometry and
animation remain City-owned. Other systems can supply the same contract without
modifying this package. Trade/Finance/Research adapters are not implemented.

## Spatial view (0.25.0)

Studio now uses an independently mounted Phaser scene, not City geometry. One
physical actor is placed under its first supplied membership; additional seats stay
in the model and are indicated on the actor. Placement expresses organization,
not a physical location measurement. Ledger remains the equivalent record view.

An exchange may carry an optional source-reported `issue` (label + evidence).
No elapsed-time threshold or missing ACK creates an issue. Time filtering removes
issues newer than the cutoff. Platform currently supplies no issue feed; the demo
is explicitly illustrative and must not be treated as that missing integration.

Initial/historical records do not animate. A newly observed delivery on the focused
exchange moves one parcel; other new evidence produces a finite endpoint marker.
No ambient loop claims activity. Reduced-motion preference suppresses movement.
Camera pan, zoom and fit are local viewing actions. UI does not move real members.
