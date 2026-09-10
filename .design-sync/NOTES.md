# design-sync notes — @bifrost/ui

Repo-specific facts a future sync should not have to rediscover.
Project: **Bifrost Dense UI** → https://claude.ai/design/p/72619b7a-f08a-4b68-9229-c1d9658ff36f

## The CSS problem (the single most important thing here)

- **`dist/` ships no usable CSS.** `src/styles/bifrost-ui.css` is tokens +
  `@theme inline` + shell chrome only. Every component is styled with **Tailwind v4
  utility classes that the consuming app compiles** — nothing in the published
  package emits them. Point `cssEntry` at `src/styles/bifrost-ui.css` and all 89
  components render unstyled, and so does every design the claude.ai/design agent
  ever builds (designs receive only `styles.css`'s `@import` closure).
- The fix lives in this repo: **`.design-sync/tailwind-entry.css`** (committed) is a
  DS-owned Tailwind entry reproducing the half `bifrost-trade-frontend/src/index.css`
  provides *around* the library. It is compiled to
  `.design-sync/.cache/bifrost-ui-tailwind.css` (gitignored) and that is `cfg.cssEntry`.
- **`cfg.buildCmd` runs both steps** — `npm run build` then the Tailwind compile.
  Re-run it before the converter on every re-sync; the compiled CSS is not committed.
- Load-bearing pieces of that entry, in case someone trims it:
  - `* { border-color: var(--border) }` — Tailwind v4 dropped v3's default border
    colour and every shadcn primitive here writes bare `border`. Without it borders
    paint `currentColor`, i.e. near-white.
  - `body { background/color }` — dark-only DS (same palette on `:root` and `.dark`),
    so an unpainted body renders `#e4e9ef` text on white.
  - `@theme inline` must **re-export** `--color-lamp-*`, `--color-surface-elevated`,
    `--color-border-strong`: `bifrost-ui.css` declares them as plain properties, which
    is not enough for Tailwind to emit `bg-lamp-green` / `text-lamp-red` utilities.
  - `@import "tw-animate-css"` + `@import "shadcn/tailwind.css"` supply the
    `data-open` / `data-closed` variants `src/ui/*` is written against.
  - `@source inline(...)` safelist — the layout utilities a *design* needs that the
    library itself never uses. Widen it rather than telling people to use
    arbitrary-value classes, which do not exist in a compiled sheet.
- Those two stylesheets plus the Tailwind CLI are installed into `.ds-sync/` and
  reached from `.design-sync/` through the `node_modules` symlink
  (`ln -sfn ../.ds-sync/node_modules .design-sync/node_modules`) — **recreate it on a
  fresh clone**, it is gitignored.

## Build / environment

- `--entry ./dist/index.js`, `--node-modules ./node_modules` (repo-local; `npm ci` first).
- Playwright: chromium build **1169** is in `~/Library/Caches/ms-playwright`, which pins
  **playwright 1.52.0**. Installing any other release fails with
  `browserType.launch: Executable doesn't exist`.
- Fonts (DM Sans, JetBrains Mono) are served from Google Fonts at runtime, exactly as
  `bifrost-trade-frontend/index.html` does it — hence `[FONT_REMOTE]`, not
  `[FONT_MISSING]`. Nothing to ship in `fonts/`.

## Discovery / grouping

- 89 PascalCase exports, not 23: every shadcn sub-export (`Dialog*`, `Sheet*`,
  `Sidebar*`, `Popover*`, `Tooltip*`, `Collapsible*`) is its own component. They are all
  real public API and are kept — the design agent needs their `.d.ts`.
- `componentSrcMap` pins **every** export to its real source file. That is what puts
  the compound families in `data-display` instead of `general`; the fuzzy finder only
  matched the 21 exports whose file is named after them. **Add an entry whenever a new
  export lands**, or it falls into `general`.
- `src/ui/*` still lands in `general` — the converter treats `ui` as a generic dir name
  and skips it. Left alone deliberately: the alternative (`docsMap` stubs) would replace
  59 per-component synthesized prompts with one shared doc, which is a worse trade than a
  weak group label. Revisit only with real per-family docs.

## Providers

- `cfg.provider = TooltipProvider` (renders no DOM, so it is safe on all 89 cards).
- `SidebarProvider` is **not** global — its wrapper div is `flex min-h-svh w-full` and
  would distort every other card. The two sidebar previews compose it themselves. A
  child inside it needs `self-start` or the flex stretch makes the card box full-height.

## Previews

- 19 authored (`.design-sync/previews/`, committed), 70 on the floor card.
  Owner scoped authoring to the Dense UI tier; the shadcn tier is the standing offer for
  incremental authoring on any later re-sync.
- Every authored cell paints its own dark surface (`rounded-lg bg-background p-4
  text-foreground`, or `bg-sidebar` for sidebar pieces). The card chrome the converter
  emits is hard-coded light (`body{background:#fff}` in `lib/emit.mjs`, not forkable),
  so a dark-only DS must bring its own ground per cell.
- Content is real Bifrost domain data — option contracts, Greeks, accounts, stream
  health. Keep it that way; `foo`/`bar` cards get imitated by the design agent.
- `DenseDataTable` is `table-fixed` with `max-w-0` cells: **width classes on `<th>` do
  not work** (tailwind-merge keeps `max-w-0` and the column collapses). Shorten the cell
  content instead — that is why contracts read `NOV21 190C`, not `2026-11-21 190 C`.

## Known render warns (triaged, expected — a warn NOT listed here is new)

- `[FONT_REMOTE]` for DM Sans / JetBrains Mono / the CJK fallback families — by design,
  see Fonts above.
- `tokens: N defined, M referenced (1 missing, below threshold)` — one unresolved
  custom property in the compiled sheet, below the converter's own threshold.

## Re-sync risks

- **The compiled stylesheet is not committed.** A re-sync that skips `cfg.buildCmd`
  builds against a stale or absent `.design-sync/.cache/bifrost-ui-tailwind.css`. If
  cards come back unstyled, that is the cause.
- **`tailwind-entry.css` is a copy of app-side setup and will drift.** It was mirrored
  from `bifrost-trade-frontend/src/index.css` at frontend Tailwind 4.3.0 / shadcn 4.8.0 /
  tw-animate-css 1.4.0. When the frontend changes its theme mappings, fonts, or variants,
  this file must follow or the DS renders differently from production. Diff the two on
  any sync that follows a frontend theme change.
- **New exports default to `general`** until `componentSrcMap` gains an entry (above).
- **`.design-sync/node_modules` is a symlink recreated per clone**, not committed.
- Authored previews import from `'@bifrost/ui'` and use real props — an API change in a
  covered component breaks its preview build (it drops to the floor card and the build
  log says `! preview build failed: <Name>`). Check that line on any version bump.
- Interaction-only states (hover, drag, popover flyouts on the collapsed rail) are not
  captured — they need a click. Not a gap in the cards, just outside static capture.
