# CLAUDE.md — bifrost-ui

与本项目用户的所有对话一律使用中文。

## 职责

**`@bifrost/ui`** — Bifrost Trade 与 Bifrost Platform 共用的监控台 Shell 与 Dense 基座。

- `MonitoringShell` — 侧栏 + 主内容 + 互链到对端 App（松耦合）
- `PageShell` / `PageHeader` — 页面画布
- `styles/bifrost-ui.css` — 共享 token 与 dense-table / segment 工具类

**不包含**业务页、Platform 探测逻辑、完整 shadcn 组件库。

## 消费者

| Repo | 用途 |
|------|------|
| bifrost-trade-frontend | 逐步 re-export layout；长期与 shadcn 共存 |
| bifrost-platform/console | Platform Console 壳 |

## 修改纪律

- 公开 API 变更 bump `version`
- UI 字符串 English；Agent 对话中文
