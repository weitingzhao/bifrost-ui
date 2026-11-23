# Provider-neutral reports v1

Import ObservationReportView and ObservationReport from
`@bifrost/ui/city/observationReport`. Providers supply existing ObservationPanel,
Block and ReadEvidence values, plus stable object keys and their detail blocks.
There is no CI, plugin, HTTP, authentication or backend action vocabulary here.
Tables reuse LedgerGrid; other blocks reuse CardView. This module does not own
Ledger filtering, sorting or paging and does not replace a specialized chart.

The host owns query scope, capture time, selection, observation time and optional
latest-read failure. Keep capturedAt stable for a supplied report; never replace
source time with render time. Missing evaluation/expiry stays unknown. An error
may accompany the previous report: it is clearly marked and cannot make its
old values appear newly measured. Empty source rows are not proof of zero work.

Object keys must be unique within the report and stable across refreshes, including
source namespace where needed. Row open identifiers and objects keys must agree.
onSelect is a read-only intent; the host decides navigation. An absent selected
key is retained and explained, not replaced. No script execution, ACK, permission
judgment or command invocation is supported. Backend status text is supplied by
the adapter; the reader does not infer health from domain names.

This is a typed in-process report boundary, not a new server endpoint or an
arbitrary JSON UI language. No history/pin store is created. A host that retains
an immutable report retains its details and evidence together; identity/scope
changes must discard both report and selection and isolate acquisition upstream.
The existing hardware-only useObservationContext is not silently coerced to this
report type. Cross-route report retention is not implemented by this slice.

Rollback: remove the opt-in import and provider projection. No backend state or
schema needs reverting. Existing hardware/communication/Ledger APIs are unchanged.
