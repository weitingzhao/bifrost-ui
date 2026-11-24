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

## Peer observation modes (0.26.0)

`AgentWorld` occupies its own viewport. Members, relationships, a bounded issue
index and local camera controls are primary; member and exchange evidence open
only on selection. Host-provided `cityHref`, `consoleHref`, `selectedId` and
`onSelected` keep navigation and system identities outside the renderer. Optional
`controls`/`notice` host an explicitly labelled development scenario.

`WorkingStudio` supports `ledgerOnly` for the Console record view. Both consume the
same snapshot and selected exchange ID. The spatial view adds no transport or
mailbox state. City accepts optional `otherLooks` navigation links; no City
geometry, animation, buildings or technology-tree behavior changes.

## Scope and projection (0.40.0)

`CommunicationScope = {channel: 'message'|'event', member: string}` is the scope vocabulary v1, shared with the engine backend's `/engine/v1/communication?channel=&member=&through=` (step 5). `through` and the selected exchange are not scope. `domain` is reserved until a live seat roster read exists. Default, Owner may veto.

`projectCommunication(exchanges, through, scope, requested)` is the one evaluation (time → channel → member → request resolution); both renderers use it and the engine backend imports the same pure function. AgentWorld and WorkingStudio accept optional `scope`/`onScopeChange` (controlled: a user filter is a request to the host) and `onProjection` (read-only notice of the evaluated window, once per change by `projectionKey`). Omitting them keeps the renderers' own filters.

## Domain glyphs (0.56.0)

`AgentWorld` accepts optional `glyphOf(domain) → glyph name` (brand layer item 6). The host passes its one domain → glyph table (the Console's `DOMAIN_GLYPH`); the renderer draws the engine's `Glyph` before each department heading and each membership in the member panel. A department with no domain, or a domain the table has no glyph for, is marked `unknown` (dashed), never given a guessed picture. Omitting `glyphOf` draws nothing (as before). The renderer still knows no domain names.

## Who is talking to whom (0.69.0)

From a first-look review on a phone (箭10 2026-11-24): the view must say who is talking to whom before anything else.
- **A requested letter not in view** is never the headline as an internal id. The caption says why in plain words, with one action:
  - sent after the time looked at → "Jump to this letter's time";
  - hidden by the current filter → "Show all communications";
  - older than the loaded history → "Load earlier history".
- **The scene always draws both parties of a letter**: the selected one, else the requested one, drawn faint with "Not at this time yet". A party the ledger does not name is a dashed "Unknown sender" / "Unknown recipient" seat.
- **Timeline cards lead with the letter**: who → whom and its kind. The delivery stage (Sent, Inbox delivery, ACK) is the small print. The letter's own words are not in the ledger events; showing them needs a platform read of the message summary.
- **Unknown says why**:
  - a seat with no domain in the roster reads "no domain";
  - a domain with no glyph yet reads "no glyph";
  - a member missing from the roster copy reads "Not in the seat roster".

## Letter summaries (0.73.0)

`CommunicationFact.summary` and `Exchange.summary` are optional fields: the sender's own one-line summary of a letter. The platform adds it to `message_posted` events (agentrt events, `body.summary`, at most 140 characters, typed letters only, never backfilled). Where a letter has one, the views say what the letter says:
- the timeline card, under who → whom;
- the caption, quoted;
- the scene's label;
- the panel's heading.
Where it has none, the letter's kind stays (note, ask…). The letter's body is never in the events.
