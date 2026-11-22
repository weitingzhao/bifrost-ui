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
