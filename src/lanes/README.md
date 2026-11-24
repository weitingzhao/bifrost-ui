# Delivery lanes

`@bifrost/ui/city/lanes` (0.72.0, Ledger line, 2026-11-24; 箭10's delivery lane, step 2).

- `DeliveryLanes({lanes, selected, onSelect, scope, sources?, oldestRun?, reading?, now?})`: one row per change
  (Change-Id), its eleven cells from a branch to PROD with the three gates (release window, PROD judgement, waiting on
  the Owner) in the fixed order of the engine's `GET /engine/v1/delivery/lanes` v1 (field table:
  `cockpit/ui-engine/delivery-lanes-fields.md`). The engine judges every word; the view draws them. A cell that ran
  more than once says `×n`; one that ran more than once and gives a reason (a land refusal) is a red dashed edge back to
  "Pushed ready/" with that reason. Opening a lane shows every cell with its run and time in three columns.
- Sources the engine could not read are said above the list ("the cells that depend on them are unknown"); runs older
  than `oldestRun` are unknown. `reading` says "Reading…" before the first answer.
- Colours come from world.ts `STATUS` (lamp = fill; word = ink on the dark ground, paper on a light one); `lanes.css`
  names no colour. At ≤ 600 px the track stands in a column, taps are at least 44 px, times are short (<1h, 3h, 2d).
- `SAMPLE_LANES` / `SAMPLE_LANES_DATA` are invented, for previews and tests only.
