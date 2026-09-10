# Designing with @bifrost/ui

`@bifrost/ui` is the shared UI base of **Bifrost** — a US-equity **options trading and
research** platform. Two consoles are built on it: **Trade** (positions, ledger,
option discovery, research) and **Ops** (clusters, pipelines, market-data health).
Both are operator tools: dense, read-heavy screens where the reader is scanning
numbers and states, not browsing.

Design accordingly. The house style is **quiet chrome, loud data**.

## 1. This system is dark-only

There is no light theme. `bifrost-ui.css` declares the same palette on `:root`
**and** `.dark`, so both roots resolve to the same near-black ground
(`--background: #0a0c0f`) with near-white ink (`--foreground: #e4e9ef`).

Consequences when you compose a screen:

- Give the page a ground. `styles.css` paints `body` with `--background`, so a
  full-page design is correct by default; **a panel you draw yourself must set
  its own** — `bg-card` for a raised surface, `bg-background` for the page ground,
  `bg-sidebar` for navigation chrome.
- Never place `text-foreground` on an unpainted container. It is near-white.
- The accent is a single lime (`--primary: #a3e635`). Spend it on the one active
  thing per view — the selected route, the primary button — and nothing else.

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
