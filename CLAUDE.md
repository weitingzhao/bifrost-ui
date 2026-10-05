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
| shadcn/ui 原语 | `src/ui/` | Button, Input, Separator, Skeleton, Tooltip, Sheet, **Dialog**（0.5.0 `presentation="sheet"` + `overlayClassName` + `sheetEnter`；0.9.0 `morphFrom`；0.11.0 `size` · 圆形关闭钮 · `--glass-drop`）, **Sidebar**, **Collapsible**, **Popover**（0.9.0 `morphFrom` · `arrow`）, **ContextMenu**（0.5.0；0.9.0 `morphFrom="pointer"`） |
| Liquid Glass（0.9.0） | `src/lib/morph.ts` · `src/data-display/{InspectorPanel,TokenSearchField,UndoToast}.tsx` · `src/layout/ScrollEdge.tsx` | Trade 设计 Rev .132 §16.6a / §17.5（Glass Study C）：`useMorph`（FLIP 从触发控件长出、point 从光标 / 箭头尖长出，关闭原路收回；`data-morph` + `--morph-from` / `--morph-origin`，关键帧在 materials.css，Radix Presence 等收回动画）· `InspectorPanel` + `InspectorField`（浮起 320 · 圆角 14 · 无 / 单 / 多选三态 · 只读写原因与出路 · 无保存键）· `TokenSearchField`（token 搜索，↑↓ ↩ ⌫ esc，自身玻璃 999）· `UndoToast`（底部胶囊、5s、⌘Z）· `ScrollEdge` + `useScrolledPast`（工具栏下 60px 滚动边缘带）。设计写的目标版本是 0.8.0，但 0.8.0 已被 SectionBand 占用，这一轮是 0.9.0。**0.9.1（Rev .135–.142 G 表 + .137 侧栏）**：`Button` 一律胶囊（圆角 999）；`FilterBar` / `[data-sr-toolbar]` 去底板（无底色、圆角、左右内边距），`sticky` 时改滚动边缘（地色 86% 渐隐 + 8px 模糊 + 下缘遮罩）；`PageHead` 页签改胶囊分段（轨道 ink 7% · 段高 24 · 选中 ink 15% + lens + 1px 落影）、去底部发丝线、ⓘ 去框淡底、说明卡浮层玻璃（`data-slot="pagehead-info"`）、动作左右 12；浮起侧栏选中行只在键盘焦点时实填（`:has(:focus-visible)`）、未选中行图标读 `--vib-mute`、列表滚动条改叠加式、Filter pages 改字段玻璃胶囊（`data-slot="nav-filter"`） |
| 列表语法 · 吸顶判定（0.10.0） | `src/styles/patterns.css`（`[data-sr-list]` 段）· `src/data-display/DenseList.tsx` · `src/layout/stuck.ts` · `DenseTable.tsx` · `IconActionButton.tsx` · `FilterBar.tsx` | Trade 设计 Rev .150–.154（§17.2「玻璃上的表格」）。**列表语法按作用域开启**：任一祖先标 `data-sr-list`（`DenseDataTable variant="list"` 标在自己的 frame 上，`DenseList` 自身就是；app 可标在页面体上），其下所有 `table` 与 `[data-sr-row]` / `[data-sr-rowhead]` 行改为苹果列表：表头无底 · sentence case · 无字距 · ink 8% 发丝，吸顶压住行时（`thead[data-stuck]`）才 glass 72%；表格 `border-collapse: separate` + 左右 6px 透明边内缩；行无线、偶数行 ink 3%；hover ink 7% / 选中 accent 18%（`data-selected="true"` 或 `aria-selected`）为 6px 圆角胶囊——行色走 td/th 四层 inset 阴影变量 `--sr-h` · `--sr-sel` · `--sr-row`（`DenseTableRow rowTint` / `<tr style="--sr-row:…">`）· `--sr-z`，叠在单元格自身底色之上（热力格保留）；分组行 `data-sr-group`（`DenseTableSubheadRow` 自动输出）无底 600；`tfoot` 行（合计）无底、无线、无 hover（中和 `DenseTableRow` 自带的 `hover:bg-primary/[0.04]`）；横滚首列静止透明、`[data-sx]` 时 glass 78% + ink 10% 分隔；行头 `tbody th` 与 td 同等。div 列表：`DenseList` / `DenseListHead`（`data-sr-rowhead`）/ `DenseListRow`（`selected` · `tint` · `onClick` → `data-sr-click` + Tab + Enter/Space，只有可点行有 hover）。**作用域外一律不变**（Ops 不开）。**吸顶判定**：`useStuck(ref)`（组件自用，FilterBar sticky 自己打 `data-stuck`）· `useStuckMarks(ref)` / `installStuckMarks(root)`（挂在滚动面上一次，给手写的 `[data-sr-toolbar][data-sticky]` / `[data-sr-edge]` 打 `data-stuck="1\|0"`、给 `thead` 打 `data-stuck`、给 `[data-sr-hscroll]` 打 `data-sx`）· 纯函数 `isStuck` / `isHeadStuck` / `isScrolledX` / `findScroller` / `markStuck`；rAF 节流、capture 监听 scroll；判定计入滚动容器的 padding-top 与元素自身 `top`。`data-sr-edge="fade\|solid"`（Owner 决策 #4：ScrollEdge solid 落成属性规则，不加组件）：贴顶才上地色 86% + 8px 模糊，fade 再加最后 8px 渐隐。**吸顶工具条（默认改动，只有 Trade 用）**：`[data-sr-toolbar][data-sticky]` 去掉 `margin-bottom:-8px`、下内边距 14→8、渐隐只在最后 8px；被测量为 `data-stuck="0"` 时无底，`"1"` 时出带；从未被测量（无 `data-stuck`）时保留带，避免内容透出。**关闭钮**：`IconActionButton variant="close"`（`data-sr-close`，圆 22 · ink 7% / hover 16%；`size="sm"` 16，芯片内删除；默认 ✕ 与 aria-label `Close`）。**KPI 英雄读数（默认改动，只有 Trade 用）**：30 / 26 / 24（行容器 ≤1400 / ≤860）、在空格处换行（`text-wrap: balance`）。新变量一律带 fallback（Ops `cssTokens.test.ts`）。行为测试在 Trade `src/components/dsListKit.test.tsx` |
| 浮层头 · 筛选 · 日历（0.11.0） | `src/layout/PanelHead.tsx` · `src/ui/{dialog,sheet}.tsx` · `src/data-display/{FilterChip,CalendarGrid,MiniMonth,TimeStrip,InspectorPanel,segmentClasses}.ts(x)` · `src/lib/calendarDates.ts` · `styles/{patterns,materials}.css` | Trade 设计 Rev .146 · .150 · .151（§17.5 · §17.9 · §17.10），设计对齐计划批 5 + 批 6 的 DS 部分合成一次发布（原拟 0.10.1–0.10.3）。**浮层**：`PanelHead`（`data-sr-head`：透明头 · ink 8% 发丝 · 12×16 · 一行 title · meta · actions · 圆形关闭；`layout="stacked"` 两行，`kicker` 题注）；`patterns.css` 新增 `[data-sr-head]`，`data-sr-scrim` / `data-sr-sheet` / `data-sr-toast` 同步 registry（遮罩 14% · sheet 离边 8 圆角 14 lens + drop · `sm` 侧玻璃 + vib 墨 · toast 浮层玻璃胶囊 bottom 72），不再读旧名 `--glass-border`；`DialogContent size="sm\|md\|lg"`（`data-size` + 宽 480 / 600 / 920；sheet 下 `sm` 玻璃、`md` / `lg` 实底 `--popover` 且墨色回到页面的；不传保持今天的玻璃）。**默认改动（Owner #2，Ops 同变）**：Dialog / Sheet 内置关闭钮 = `data-sr-close` 圆钮（22 · ink 7%），sheet 与 Dialog 阴影 = `--glass-lens` + `--glass-drop`；`InspectorPanel` 头换 `PanelHead`（体内边距 14→16）。**默认改动（Owner #3，Ops 同变）**：`SegmentControl` 选中段 = ink 15% + lens + 1px 落影（与 PageHead 页签同值，不读 `--card`）。**筛选**（Owner #5 · #14）：`FilterChip`（`pressed` / `onPressedChange` / `count`，开 ink 15% + ink、关 ink 4% + mute，`aria-pressed`，forwardRef + 透传 button 属性，可拖拽）· `FilterTray`（`group` 托盘 ink 4% 圆角 14；`joined` 平接胶囊圆角 12 给 Positions / Backing Scope · Type）· `FilterGroup`（组头三态 `role="checkbox" aria-checked=true\|mixed\|false`，全开 → 全关、其余 → 全开；纯函数 `filterGroupState` / `nextGroupValue`）。**日历**（Owner #19 · #22）：`CalendarGrid`（`month` / `span="week"` · `today` · `selected` · `onSelect` · `onMonthChange` · `onOpen` · `weekdaysOnly` · `hasContent` · `holidays`（closed / early）· `renderCell` / `renderCorner` / `cellTone` / `cellLabel`；周一起只画工作日，周末有内容 / 是今天 / 被选中才补列；今天 accent 60% 描边，选中 ink 9%；`ctx.tense` = past · today · future 由页面决定今天显示哪些层；键盘 ← → ↑ ↓ T [ ] Enter）· `CalendarNav`（‹ 标题 › Today）· `MiniMonth`（7×6 格 28，`status` 点 / 环，`isDisabled`，周末默认淡化不可选 = 设计 ASK 暂定选项 3）· `TimeStrip`（`marks` / `lanes` / `bars`，今天竖线 + `today`，周一细线，← → Home End，[ ] `onPage`）· 日期工具 `stripDates` / `formatDayLabel` / `formatMonthLabel` / `formatWeekLabel` / `formatRelativeDays` / `isoAddDays` 等（ISO 字符串、UTC 计算）。DS 不取数：节假日、格子内容、图层逻辑都由调用方传。行为测试在 Trade `src/components/dsFilterCalendarKit.test.tsx` |
| 共享导航样式 | `src/shell/shellNavClasses.ts` | 子项选中/未选中、分组标题、Popover 飞层 — Trade `AppSidebar` 与 `ShellNavSidebar` 共用 |
| 共享导航 renderer | `src/shell/ShellNavSidebar.tsx` | 输入 `ShellNavGroup[]` + 可选 `seatContent` / `partnerContent` slots — Collapsible 分组、Popover 折叠飞层、Docs / PeerApp |
| 导航类型 | `src/shell/types.ts` | `ShellNavGroup` / `ShellNavItem` / `ShellNavSubGroup` + `getAllNavItems()` |
| Branding | `src/branding/BifrostLogo.tsx` | `BifrostLogoMark` / `BifrostLogoFull`（`badge` / `contextLabel` / `productSubtitle`） |
| 布局 | `src/layout/` | **`SectionBand`**（0.8.0，Trade 设计 Rev .117 §17.8：页面段落的段头行，整行可点收放、默认展开、按页记忆（`localStorage bifrost.band`）；段体 = 其后直到下一个段头的兄弟节点，收起时标 `data-sr-band-hid`，由 `styles/patterns` 隐藏）/ `PageShell` / `PageHeader`（旧版，说明上屏；Ops 仍用）/ **`PageHead` + `PageHeadAction`**（0.4.16，设计 §16.10 统一页头：ⓘ 说明、时间戳位、meta、下划线 Tab、带状态色的操作、`onTitleVisible`）/ `shellChrome.ts`（`SHELL_TOP_BAR_HEIGHT_CLASS`） |
| Hooks | `src/hooks/` | `useIsMobile` |
| Data-display | `src/data-display/` | `SegmentControl`（0.11.0 选中段 ink 15% + lens）, `IncludeExcludeToggle`, `StatusLamp`, `HealthLamp`, `DenseTag`, `DenseTagButton`, `DenseDataTable`（`standard` 启用 §17.2；0.10.0 `variant="list"`）, `DenseTableHeader/Body/HeadRow/Row/Head/Cell/SubheadRow/DetailRow`（Head/Cell 的 `col` 列型）, `EmptyState`, **`ViewState`**（§17.1 七种非就绪态，0.4.17）, **`ToolbarClear`**（§17.3 Clear N）, `IconActionButton`（0.10.0 `variant="close"`）, **`DenseList` / `DenseListHead` / `DenseListRow`**（0.10.0）, `ConfirmDialog`（0.5.0 默认 sheet）, **`NumberField`** + `stepValue`（0.5.0）, **`KpiCard` / `KpiStrip`**、**`FilterBar`**（0.5.0，§17.3/§17.4 模式的组件形态）, **`FilterChip` / `FilterTray` / `FilterGroup`**、**`CalendarGrid` / `CalendarNav` / `MiniMonth` / `TimeStrip`**（0.11.0） |
| Table classes | `src/data-display/denseTableClasses.ts` | `denseTable`, `denseTableCellPadding`, `denseTableNumCell`, `denseTableEntityCell/Link` |
| Token & CSS | `src/styles/bifrost-ui.css` | 共享色板、5 级 dense typography（`--text-dense-*` + `@theme`）、滚动条 token（`--scrollbar-*`）、`.dense-scroll-x` 滚动容器 |
| 交互模式层 | `src/styles/patterns.css` | 设计 §17（0.4.17）：表格列型 / 宽表首列固定 / 工具条 / KPI / 侧滑·遮罩·提示条，**全部按 data 属性启用**，不标属性的元素不受影响；`bifrost-ui.css` 引它，Trade 单独引 `@bifrost/ui/styles/patterns`。它不在 Tailwind 的 layer 里，同名属性会压过 Tailwind 类 |
| 浮起侧栏皮 | `src/styles/shell.css` | Trade 设计 Rev .61（0.4.18）：`ShellNavSidebar` 盖 `data-shell-chrome="floating"`，本文件按它启用——内缩 8 / 圆角 14 / 玻璃、胶囊行（有焦点时填满强调色）、树线与 caption 横线退役、箭头去框（`data-navcaret` = dual · group · layer）。**0.5.0 起是唯一形态**（Owner 2026-09-25：Ops 也采纳 1a，旧外观不留变体；`chrome` 属性保留但不起作用）；`bifrost-ui.css` 引它，Trade 单独引 `@bifrost/ui/styles/shell` |
| 材质 · 动效 · 显示钩子 | `src/styles/materials.css` | 0.5.0（设计 Rev .59–.74「苹果化」整轮提升）：`--card-*` / `--table-rule` / `--control-*` / `--field-fill` / `--focus-glow` / `--glass-*` / `--popper-*` / `--mo-*`（**0.9.0 Liquid Glass，Rev .132**：`--glass-base` · `--glass-a-*` · `--glass-bg{,-panel,-field,-float}` · `--glass-filter{,-field,-float}` · `--glass-rim`（渐变描边，`padding-box` 底色 + `border-box` rim + 1px 透明边）· `--glass-lens` · `--glass-drop` · `--glass-tint-primary{,-bg}`（主按钮着色玻璃）· `--vib-mute/-mute2/-soft`（玻璃面内次级墨色，只作用于 DS 的玻璃件）· `--scroll-edge-*` · `--press`（按下变亮不缩放）· `--mo-morph` / `--mo-ease-morph` / `--mo-morph-back` / `--mo-spring-open`；`[data-glass-thickness="clear"]` 清透档；`data-glass="solid"` / reduced transparency 同时去 rim 与 lens；`data-contrast="more"` rim 换 ink 18% 实线；sheet 遮罩 38% → 14%；菜单圆角 11、项 6；浮起侧栏换新材质、行圆角 6、开合 380ms 弹簧）（曲线叫 `--mo-ease-*`，因为 `--ease-*` 是 Tailwind 的主题变量）；Radix 弹层的玻璃与成对进出、sheet、按下 .97、`html[data-contrast="more"]`、`html[data-glass="solid"]` / `prefers-reduced-transparency`。颜色先读 Trade 皮肤 `--sk-*`，没有就用 DS 调色板。组件默认外观随之改为 1a（DenseTag 胶囊、secondary/outline 按钮去框、Input、DenseDataTable 卡片框 + 玻璃吸顶表头）；`.panel-elevated` / `.badge-ui` / `.dense-table` 同步改。0.5.1 补齐三处漏网的旧框：`SegmentControl` 轨道（`segmentGroupClass`，去框、`--control-fill`）、`CollapsibleGroup`（card = 卡片材质，inset = `--table-rule`，Header 去掉底色带、悬停再叠一层墨色）、`ShellNavSidebar` 的分区线 / footer 线（`--table-rule`，navPrefix 不再铺不透明 `bg-sidebar`，分节 caption 横线按 `data-navcap-rule` 退役）与 peer 链接卡。0.5.2 跟设计 Rev .84/.85/.93 的全站规则：工具条标签 11/600 句式（`patterns.css`）、恰好四张的英雄行在行宽 <860 时 2×2（行本身是 container）、分段按钮不折行、横滚框里的 DS 表头粘在框顶（`top:0`，不吃页面的 `--sticky-offset`）。0.5.3 清掉包内剩下的中性边框：`patterns.css` 的 `standard` 表格线 / 固定首列边 / 工具条分隔 → `--table-rule`，侧滑 sheet 与 toast 边 → `--glass-border`；`PageHead` 底线 → `--table-rule`、ⓘ 圆钮去框填墨（Rev .64）、ⓘ 说明卡 = 弹层材质；`ViewState` 状态条 = 卡片材质（stale 的琥珀框保留）；`DenseTableDetailRow` 线色 → `--table-rule`；`ShellNavSidebar` 删掉被浮起皮 / materials 盖掉的 header 底线、飞出菜单框底、`navRowSyntax` 箭头框；`bifrost-ui.css` 删掉无人引用的 `.shell-*` 旧监控壳规则。仍用中性边框的只剩 shadcn 原样的 `src/ui/sidebar.tsx`（已被浮起皮覆盖）。0.5.4 去掉 `DenseTableSubheadRow` / `DenseTableDetailRow` 的 `bg-secondary` 底色带（分组行悬停不变色，明细行用普通行的悬停）。`bifrost-ui.css` 引它，Trade 单独引 `@bifrost/ui/styles/materials` |
| 语义色 token | `src/styles/semantic.css` | accent / 实体身份 / 方向色，暗 + 亮两套（0.4.13 入包，0.4.14 拆成单独文件）；lamp 四色暗亮同值（0.4.15 从 `bifrost-ui.css` 移入；同版删 `--color-up/down` 别名）；0.7.1 跟 Trade 设计 Rev .111：`--sk-instance` → **`--sk-trade`**（值不变），另立 **`--sk-objective`**（今日同值），`--sk-instance` 作别名保留一个版本；`bifrost-ui.css` `@import` 它，自带核心色板的 app 单独引 `@bifrost/ui/styles/semantic` |
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

- 公开 API 变更 bump `version`（当前 `0.11.0`）
- UI 字符串 English；Agent 对话中文
- 新增 shadcn 组件放 `src/ui/`，保持与官方 shadcn v4 一致 —— **一处例外见下**
- **包 Radix primitive 的 wrapper 用 `React.forwardRef`**（0.4.8 起）。当初是必须的：本库与
  两个 app 都在 React 18.3.1，而官方 shadcn v4 的 ref-as-prop 写法在 18 上会让 ref 被静默
  丢弃——Radix 靠 ref 做 `asChild` 组合（Slot）、`Presence` 动画收尾与 Popper 定位。
  **0.4.11 起三处都在 React 19，这条不再是必须的**，只是仍然正确：19 弃用而未移除
  `forwardRef`，实测零弃用警告。要撤销就整批撤，别新旧混写——半迁移的库比任一种写法都难读。
- 导航样式改动在 `shellNavClasses.ts`；交互/renderer 改动在 `ShellNavSidebar`（Ops / Trade 共用）
- Trade 扩展：`matchActive`、`renderItemIcon`、`renderItemExtras`、`renderInAppLink`、`footer`、`accordionStorageKey`、`filter`（0.7.0：品牌标下的「Filter pages」字段——从 `navGroups` 建索引含折叠子页，`extra` 追加树外页面；`/` 聚焦、↑↓、Enter、Esc；图标栏态隐藏。纯逻辑在 `shellNavFilterModel.ts`：`shellNavFilterIndex` / `shellNavFilterMatch`）
- Ops 扩展：`productContext`（当前 Task Mode / View 名，显示在 Ops badge 后）；`seatContent` / `partnerContent` slots（Mission Control / Engineer，不进 SidebarContent 滚动）；`ShellNavGroup.emphasis`（Support 组更淡，**不是** zone 字段）
- Slot 类型：`ShellNavSlotContent = ReactNode | ((collapsed: boolean) => ReactNode)` — 与 `navPrefix` 一致；未传 seat/partner 时 Trade 零改动
- 改动 `src/shell/types.ts` 中的类型后，确认两端消费者 tsc 通过
