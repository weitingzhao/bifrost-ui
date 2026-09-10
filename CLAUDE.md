# CLAUDE.md — bifrost-ui

与本项目用户对话一律使用中文回复（无论用户用何种语言提问）；UI 字符串与代码标识符使用 English。

## 工作区定位（2026-09-06）

| 项 | 值 |
|---|---|
| 域 / 载荷 | 跨域共享 `@bifrost/ui` 组件库（shadcn 原语、Dense Data Table、Shell 导航） |
| 消费方式 | `bifrost-trade-frontend` 本地 link（`../bifrost-ui`）；Satellite 发布链的 mirror-sync 一并 clone；platform console 亦复用 |
| 注意 | 自带 `node_modules/react` 与 `lucide-react` —— 前端 vitest 需 `resolve.dedupe` + inline radix 才能渲染 |
| 仓库可见性 | GitHub **PUBLIC**（12 个 repo 全部公开）—— `.env`、Secret YAML、dump、kubeconfig、账户内容永不入库 |
| 硬边界 | D10 交易执行冻结（BLOCKED）· D13 三域边界 · 平台/业务解耦（Flywheel A/B） |
| 事实基线 | `../AGENT_FACTS.md`（§8c 运行时与安全事实）· 规则 `../CLAUDE.md`（§8 Claude Code 运行配置） |

会话请在工作区根 `/stocks` 启动（加载治理层 hooks / auto mode / 共享记忆）；运行时与安全事实以 `../AGENT_FACTS.md` §8c 为准。

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

- 公开 API 变更 bump `version`（当前 `0.4.8`）
- UI 字符串 English；Agent 对话中文
- 新增 shadcn 组件放 `src/ui/`，保持与官方 shadcn v4 一致 —— **一处例外见下**
- **包 Radix primitive 的 wrapper 必须 `React.forwardRef`**（0.4.8）。官方 shadcn v4 用
  React 19 的 ref-as-prop 写法，本工作区在 React 18.3.1 上，那种写法会让 ref 被静默丢弃：
  Radix 靠 ref 做 `asChild` 组合（Slot）、`Presence` 动画收尾与 Popper 定位。直接粘贴官方
  代码会把这个 bug 带回来。升到 React 19 后这条可以整体撤销。
- 导航样式改动在 `shellNavClasses.ts`；交互/renderer 改动在 `ShellNavSidebar`（Ops / Trade 共用）
- Trade 扩展：`matchActive`、`renderItemIcon`、`renderItemExtras`、`renderInAppLink`、`footer`、`accordionStorageKey`
- Ops 扩展：`productContext`（当前 Task Mode / View 名，显示在 Ops badge 后）；`seatContent` / `partnerContent` slots（Mission Control / Engineer，不进 SidebarContent 滚动）；`ShellNavGroup.emphasis`（Support 组更淡，**不是** zone 字段）
- Slot 类型：`ShellNavSlotContent = ReactNode | ((collapsed: boolean) => ReactNode)` — 与 `navPrefix` 一致；未传 seat/partner 时 Trade 零改动
- 改动 `src/shell/types.ts` 中的类型后，确认两端消费者 tsc 通过
