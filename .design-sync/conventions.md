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

## 2. Surfaces are materials, not boxes

Since 0.5.0 the package draws surfaces the way macOS does: **fills, not frames.**
The tokens live in `@bifrost/ui/styles/materials` (included in `bifrost-ui.css`).

| Role | Looks like | Use |
|---|---|---|
| Group | no border, ink 4% fill, radius 12, no shadow | `.panel-elevated`, or `background: var(--card-fill); border-radius: var(--card-radius)` |
| Tag | no border, 15% of its own ink, full capsule | `DenseTag` (automatic) |
| Secondary control | no border, ink 8% fill (13% hover), radius 8 | `Button variant="outline" \| "secondary"` (automatic) |
| Field | no border, ink 7% fill, 3px accent glow on focus | `Input`, `NumberField` (automatic) |
| Floating layer | glass: translucent, blurred, hairline | popovers, tooltips, menus, the sidebar (automatic) |

- **Do not draw a neutral solid frame** (`border border-border rounded-*`) around a
  group. A border in a state colour (warning, destructive) is a reading and stays.
- **A table brings its own frame.** `DenseDataTable` sits in the group material,
  its rules are `--table-rule` (ink 6%), and its header row is sticky glass.
  `stickyHeader={false}` lets the header scroll away.
- **Dialogs are sheets.** `DialogContent presentation="sheet"` drops from under the
  top bar and **Enter runs the footer's rightmost button**; `ConfirmDialog` is a
  sheet by default. `presentation="centered"` is for a command palette, not a
  confirmation.
- **Motion is short and paired**: `--mo-fast` 150ms, `--mo-pop` 160ms, `--mo-in`
  240ms, `--mo-out` 180ms, curves `--mo-ease-out` / `-in` / `-spring`. Buttons
  press to 0.97. Everything stops under `prefers-reduced-motion`.
- **Two display hooks on `<html>`**: `data-contrast="more"` brings group frames
  back and lifts table rules, glass edges and tag outlines; `data-glass="solid"` (or `prefers-reduced-transparency`)
  turns every glass layer opaque.

## 3. Mount two providers at the root

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

## 4. Two tiers of component — reach for the Dense UI tier first

| Group | What it is | When |
|---|---|---|
| `data-display` | **Dense UI** — the house primitives (tables, tags, lamps, segments, collapsible groups, view states, KPI boxes, filter bar, number field) | Anything showing data |
| `layout` / `shell` / `branding` | Page frame, navigation, product mark | Page and app chrome |
| `general` | Stock **shadcn/ui v4** primitives (Button, Input, Dialog, Sheet, Popover, Tooltip, ContextMenu, Collapsible, Sidebar, Separator, Skeleton) | Everything else; compose them the standard shadcn way |

If a Dense UI component covers the job, use it instead of hand-rolling one out of
`general` primitives. `DenseDataTable` over a bare `<table>`; `DenseTag` over a
styled `<span>`; `SegmentControl` over custom pills; `IconActionButton` over a
`Button` with an icon in it; `ViewState` over centred prose; `KpiCard` /
`KpiStrip` over a grid of number boxes; `FilterBar` over a row of controls in a
border; `NumberField` over an `Input` holding a price or a quantity.

## 5. Rules the data screens follow

**Numbers line up.** Every numeric column gets `denseTableNumCell`
(right-aligned, monospace, `tabular-nums`). A dense table whose digits do not
line up down the column defeats the point of the table.

**Not knowing is its own state.** An empty result is a fact about the query; a
failed fetch is a fact about the system; they must not render the same.
`ViewState` names seven non-ready kinds — `loading`, `failed`, `stale`, `empty`,
`filtered`, `signedout`, `notwired` — and only `failed` (red) and `stale` (amber)
take a colour. `stale` is a strip over data still shown, never a replacement for
it. Pick the kind that is true and give the reader the action that ends it.

**A KPI's state is its edge, not its ink.** `KpiCard state="warn" | "danger"`
colours the box's border; the reading keeps its own ink (a P&L colour, a lamp).
Labels are sentence case, readings are mono.

**A grey lamp is not a red lamp.** `HealthLamp` normalises every unrecognised
reading (including `none` and `""`) to grey. Never map unknown onto the failure
colour — an unprobed service is not a down service.

**The variant carries the meaning, not the position.** A `DenseTag`'s colour says
what the row's state is; its place in the row says nothing. Same for lamps.

**Labels on icon-only controls.** `IconActionButton` takes both `title` and
`ariaLabel` and neither is optional. An icon on its own names nothing.

## 6. Density is the type scale

The body size is **13px** (`text-dense-body`), not 16. The five-step dense scale —
`text-dense-body` / `-label` / `-meta` / `-caption` / `-micro` — is what page copy,
table cells, column heads and captions use. Reach for `text-sm` / `text-base` only
for page titles and headings. Table cell padding comes from
`--table-cell-py` / `--table-cell-px`; do not hand-tune it per table.

Body copy is **DM Sans**; anything a reader compares digit-by-digit — prices,
Greeks, quantities, contract symbols — is **JetBrains Mono** with `tabular-nums`.
Both load from Google Fonts at runtime.

## 7. The utility vocabulary that ships

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
always available and are how you should be colouring things anyway. The material
tokens are custom properties, so reach them through inline `style`
(`style={{ background: 'var(--card-fill)' }}`).

## 8. Page frame

`PageShell` gives the route its ground, minimum height and padding
(`default` = `p-4`, `compact` = `px-3 py-2`, `none`). `PageHead` gives it a title,
the page's description behind an ⓘ (`info`), a freshness `stamp`, mono `meta`
counts, `actions` (as `PageHeadAction`) and underlined `tabs`. Filters go in a
`FilterBar` directly under the head, not inside it. Start a screen with those,
then fill the body. (`PageHeader`, with the description on screen, is the older
head and is still used by the Ops console.)
