# Designing with @bifrost/ui

`@bifrost/ui` is the shared UI base of **Bifrost** — a US-equity **options trading and
research** platform. Two consoles are built on it: **Trade** (positions, ledger,
option discovery, research) and **Ops** (clusters, pipelines, market-data health).
Both are operator tools: dense, read-heavy screens where the reader is scanning
numbers and states, not browsing.

Design accordingly. The house style is **quiet chrome, loud data**.

## 1. Two themes, one violet accent — lime is a ticker

**Dark is the default, and there is a light theme.** `bifrost-ui.css` declares the
core palette on `:root` **and** `.dark` — near-black ground (`--background: #0a0c0f`),
near-white ink (`--foreground: #e4e9ef`). The consoles switch to light with
`data-theme="light"` on `<html>`; the package ships the light values of the semantic
tokens below, and the light grey-paper ground and surfaces come from the consuming
app's ramp (the core palette in this package has no light set). The semantic tokens
are also shipped alone as `@bifrost/ui/styles/semantic`, which is how the Trade
console takes them.

Consequences when you compose a screen:

- Give the page a ground. `styles.css` paints `body` with `--background`, so a
  full-page design is correct by default; **a panel you draw yourself must set
  its own** — `bg-card` for a raised surface, `bg-background` for the page ground,
  `bg-sidebar` for navigation chrome.
- Never place `text-foreground` on an unpainted container. It is near-white.
- Write colour through the tokens, never a hex: a hex does not flip with the theme.

**The accent is violet, `--sk-accent`.** Spend it on the one active thing per view —
the selected route, the primary action, a focus ring — and nothing else. `--primary`
keeps a lime package default for component compatibility: the Trade console maps it to
`--sk-accent`, the Ops console keeps the default. Do not read `--primary` as the house
accent.

**Lime is `--sk-ticker`: a symbol's identity, never emphasis.** Each financial entity
has one ink, the same everywhere; the three direction tokens colour signed numbers
only (a lamp or a tag never takes them).

| Token | Means | Dark | Light |
|---|---|---|---|
| `--sk-accent` | emphasis — the one active thing | `#a78bfa` | `#6d28d9` |
| `--sk-ticker` | a symbol / stock | `#a3e635` | `#3f6212` |
| `--sk-contract` | an option contract, whole | `#7dd3fc` | `#075985` |
| `--sk-instance` | a strategy instance | `#c084fc` | `#6b21a8` |
| `--color-profit` | gain / up, signed | `#4ade80` | `#15803d` |
| `--color-loss` | loss / down, signed | `#f87171` | `#b91c1c` |
| `--color-unrealized` | unrealized — the whole column, either sign | `#fb923c` | `#9a3412` |
| `--color-up` / `--color-down` | aliases of profit / loss | — | — |

## 2. Mount two providers at the root

```jsx
<TooltipProvider>
  <SidebarProvider>{yourApp}</SidebarProvider>
</TooltipProvider>
```

- **`TooltipProvider`** is required by anything that shows a tooltip. Notably
  `ShellNavSidebar` in its collapsed icon rail: without it that state **throws**
  (`Tooltip must be used within TooltipProvider`) and renders nothing.
- **`SidebarProvider`** holds the open/collapsed state every `Sidebar*` piece
  reads. Only needed when the design has a sidebar — but then it must wrap the
  page content too, since the content pane sits beside the sidebar inside it.

## 3. Two tiers of component — reach for the Dense UI tier first

| Group | What it is | When |
|---|---|---|
| `data-display` | **Dense UI** — the house primitives (tables, tags, lamps, segments, collapsible groups, empty states) | Anything showing data |
| `layout` / `shell` / `branding` | Page frame, navigation, product mark | Page and app chrome |
| `general` | Stock **shadcn/ui v4** primitives (Button, Input, Dialog, Sheet, Popover, Tooltip, Collapsible, Sidebar, Separator, Skeleton) | Everything else; compose them the standard shadcn way |

If a Dense UI component covers the job, use it instead of hand-rolling one out of
`general` primitives. `DenseDataTable` over a bare `<table>`; `DenseTag` over a
styled `<span>`; `SegmentControl` over custom pills; `IconActionButton` over a
`Button` with an icon in it; `EmptyState` over centred prose.

## 4. Rules the data screens follow

**Numbers line up.** Every numeric column gets `denseTableNumCell`
(right-aligned, monospace, `tabular-nums`). A dense table whose digits do not
line up down the column defeats the point of the table.

**Not knowing is its own state.** Loading, failed, empty and ready are four
branches, never three. An empty result is a fact about the query; a failed fetch
is a fact about the system; they must not render the same. `EmptyState` carries
all three non-ready cases — say which one it is in the copy, and give the reader
the action that ends it.

**A grey lamp is not a red lamp.** `HealthLamp` normalises every unrecognised
reading (including `none` and `""`) to grey. Never map unknown onto the failure
colour — an unprobed service is not a down service.

**The variant carries the meaning, not the position.** A `DenseTag`'s colour says
what the row's state is; its place in the row says nothing. Same for lamps.

**Labels on icon-only controls.** `IconActionButton` takes both `title` and
`ariaLabel` and neither is optional. An icon on its own names nothing.

## 5. Density is the type scale

The body size is **13px** (`text-dense-body`), not 16. The five-step dense scale —
`text-dense-body` / `-label` / `-meta` / `-caption` / `-micro` — is what page copy,
table cells, column heads and captions use. Reach for `text-sm` / `text-base` only
for page titles and headings. Table cell padding comes from
`--table-cell-py` / `--table-cell-px`; do not hand-tune it per table.

Body copy is **DM Sans**; anything a reader compares digit-by-digit — prices,
Greeks, quantities, contract symbols — is **JetBrains Mono** with `tabular-nums`.
Both load from Google Fonts at runtime.

## 6. The utility vocabulary that ships

Components are styled with Tailwind v4 utilities, and `styles.css` carries a
**compiled** stylesheet, not a Tailwind runtime. It contains every class the
library itself uses, plus a deliberate safelist of ordinary layout utilities
(flex/grid, `gap-*`, `p-*`/`m-*`, `w-*`/`h-*`, `max-w-*`, `rounded-*`, `border*`,
`text-{xs..4xl}`, `font-*`, the semantic colour utilities, `space-{x,y}-*`,
positioning and overflow).

Stay inside that vocabulary, or use inline `style` for anything exotic. An
arbitrary-value class like `w-[37px]` or a rarely-used utility **will not exist**
in the stylesheet and silently does nothing. Semantic colours
(`bg-card`, `text-muted-foreground`, `border-border`, `text-lamp-red`, …) are
always available and are how you should be colouring things anyway.

## 7. Page frame

`PageShell` gives the route its ground, minimum height and padding
(`default` = `p-4`, `compact` = `px-3 py-2`, `none`). `PageHeader` gives it a
title, an optional one-sentence description that says **what is on screen right
now**, an `actions` slot on the same line, and an optional `breadcrumb` above.
Start a screen with those two, then fill the body.
