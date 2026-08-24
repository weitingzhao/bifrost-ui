# CLAUDE.md — bifrost-ui

与本项目用户对话一律使用中文回复（无论用户用何种语言提问）；UI 字符串与代码标识符使用 English。

## 职责

**`@bifrost/ui`** — Bifrost Trade 与 Bifrost Platform 共用的 UI 基座。

### 层级

| 层 | 目录 | 说明 |
|----|------|------|
| shadcn/ui 原语 | `src/ui/` | Button, Input, Separator, Skeleton, Tooltip, Sheet, **Dialog**, **Sidebar**, **Collapsible**, **Popover** |
| 共享导航样式 | `src/shell/shellNavClasses.ts` | 子项选中/未选中、分组标题、Popover 飞层 — Trade `AppSidebar` 与 `ShellNavSidebar` 共用 |
| 共享导航 renderer | `src/shell/ShellNavSidebar.tsx` | 输入 `ShellNavGroup[]` + 可选 `seatContent` / `partnerContent` slots — Collapsible 分组、Popover 折叠飞层、Docs / PeerApp |
| 导航类型 | `src/shell/types.ts` | `ShellNavGroup` / `ShellNavItem` / `ShellNavSubGroup` + `getAllNavItems()` |
| Branding | `src/branding/BifrostLogo.tsx` | `BifrostLogoMark` / `BifrostLogoFull`（`badge` / `contextLabel` / `productSubtitle`） |
| 布局 | `src/layout/` | `PageShell` / `PageHeader` / `shellChrome.ts`（`SHELL_TOP_BAR_HEIGHT_CLASS`） |
| Hooks | `src/hooks/` | `useIsMobile` |
| Data-display | `src/data-display/` | `SegmentControl`, `IncludeExcludeToggle`, `StatusLamp`, `HealthLamp`, `DenseTag`, `DenseTagButton`, `DenseDataTable`, `DenseTableHeader/Body/HeadRow/Row/Head/Cell/SubheadRow/DetailRow`, `EmptyState`, `IconActionButton`, `ConfirmDialog` |
| Table classes | `src/data-display/denseTableClasses.ts` | `denseTable`, `denseTableCellPadding`, `denseTableNumCell`, `denseTableEntityCell/Link` |
| Token & CSS | `src/styles/bifrost-ui.css` | 共享色板、5 级 dense typography（`--text-dense-*` + `@theme`）、滚动条 token（`--scrollbar-*`）、`.dense-scroll-x` 滚动容器 |
| `cn()` | `src/lib/cn.ts` | `clsx` + `tailwind-merge` |

### peerDependencies

`radix-ui`, `class-variance-authority`, `lucide-react`, `clsx`, `tailwind-merge`, `react`, `react-dom`

## 消费者

| Repo | 用途 |
|------|------|
| bifrost-trade-frontend | `AppSidebar` → `ShellNavSidebar`；`navConfig.ts` 直接使用 `ShellNavGroup[]` |
| bifrost-platform/console | `ConsoleSidebar` → `ShellNavSidebar` + `consoleNavConfig.ts` |

### tsconfig 要求

消费者的 `tsconfig.json` 必须包含 `paths` 重定向，以避免双重 `@types/react` 类型冲突：

```json
"paths": {
  "@bifrost/ui": ["<relative-path>/bifrost-ui/src/index.ts"],
  "react": ["./node_modules/@types/react"],
  "react-dom": ["./node_modules/@types/react-dom"],
  "radix-ui": ["./node_modules/radix-ui"],
  "class-variance-authority": ["./node_modules/class-variance-authority"],
  "lucide-react": ["./node_modules/lucide-react"]
}
```

## 修改纪律

- 公开 API 变更 bump `version`（当前 `0.4.1`）
- UI 字符串 English；Agent 对话中文
- 新增 shadcn 组件放 `src/ui/`，保持与官方 shadcn v4 一致
- 导航样式改动在 `shellNavClasses.ts`；交互/renderer 改动在 `ShellNavSidebar`（Ops / Trade 共用）
- Trade 扩展：`matchActive`、`renderItemIcon`、`renderItemExtras`、`renderInAppLink`、`footer`、`accordionStorageKey`
- Ops 扩展：`productContext`（当前 Task Mode / View 名，显示在 Ops badge 后）；`seatContent` / `partnerContent` slots（Mission Control / Engineer，不进 SidebarContent 滚动）；`ShellNavGroup.emphasis`（Support 组更淡，**不是** zone 字段）
- Slot 类型：`ShellNavSlotContent = ReactNode | ((collapsed: boolean) => ReactNode)` — 与 `navPrefix` 一致；未传 seat/partner 时 Trade 零改动
- 改动 `src/shell/types.ts` 中的类型后，确认两端消费者 tsc 通过
