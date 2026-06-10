# @bifrost/ui

Shared **monitoring shell** for Bifrost Trade (business) and Bifrost Platform (environment).

## Scope

| In `@bifrost/ui` | Not in `@bifrost/ui` |
|------------------|----------------------|
| `MonitoringShell`, sidebar chrome, peer app link | Business pages (Positions, Live, …) |
| `PageShell`, `PageHeader` | Platform matrix/topology logic |
| Dense tokens CSS, `SegmentControl`, `StatusLamp` | shadcn full set (stays in trade-frontend for now) |
| `cn()` utility | API clients, domain hooks |

## Consumers

**First time:** install this package's dependencies (TypeScript resolves types from here):

```bash
cd bifrost-ui && npm install
```

```json
{
  "dependencies": {
    "@bifrost/ui": "file:../bifrost-ui"
  }
}
```

```ts
import '@bifrost/ui/styles'
import { MonitoringShell, PageShell, SegmentControl } from '@bifrost/ui'
```

### Vite (consumer)

```ts
// vite.config.ts
resolve: {
  alias: { '@bifrost/ui': path.resolve(__dirname, '../bifrost-ui/src/index.ts') },
},
server: { fs: { allow: ['..'] } },
```

## Versioning

Bump `package.json` version when changing public exports or token CSS. Pin in frontend/platform.
