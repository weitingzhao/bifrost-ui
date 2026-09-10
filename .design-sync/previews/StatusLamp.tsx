import { StatusLamp } from '@bifrost/ui'

function Surface({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex w-4 justify-center">{children}</span>
      <span className="text-dense-body text-muted-foreground">{label}</span>
    </div>
  )
}

/** `kind="reach"` (the default) — can we get to it at all. Four readings:
    ok / degraded / fail / unknown. */
export const Reachability = () => (
  <Surface>
    <div className="flex flex-col gap-2">
      <Row label="platform-api · 8780 — 200 in 41ms">
        <StatusLamp value="ok" />
      </Row>
      <Row label="research-api — 200, p95 over budget">
        <StatusLamp value="degraded" />
      </Row>
      <Row label="trade-socket — connection refused">
        <StatusLamp value="fail" />
      </Row>
      <Row label="daemon — never probed this session">
        <StatusLamp value="unknown" />
      </Row>
    </div>
  </Surface>
)

/** `kind="auth"` — a second vocabulary over the same four colours.
    `missing` reads amber, `invalid` and `blocked` read red, `skipped` grey. */
export const AuthStatus = () => (
  <Surface>
    <div className="flex flex-col gap-2">
      <Row label="ok — token accepted">
        <StatusLamp kind="auth" value="ok" />
      </Row>
      <Row label="missing — no operator token in this session">
        <StatusLamp kind="auth" value="missing" />
      </Row>
      <Row label="invalid — token rejected by the gateway">
        <StatusLamp kind="auth" value="invalid" />
      </Row>
      <Row label="skipped — endpoint needs no auth">
        <StatusLamp kind="auth" value="skipped" />
      </Row>
      <Row label="blocked — write path frozen by policy">
        <StatusLamp kind="auth" value="blocked" />
      </Row>
    </div>
  </Surface>
)

/** `variant="outline"` — a hollow ring for the unselected state of a card that
    is otherwise identical to its selected sibling. */
export const FilledVsOutline = () => (
  <Surface>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Row label="filled — selected">
          <StatusLamp value="ok" />
        </Row>
        <Row label="outline — not selected">
          <StatusLamp value="ok" variant="outline" />
        </Row>
      </div>
      <div className="flex items-center gap-4">
        <Row label="filled">
          <StatusLamp value="fail" />
        </Row>
        <Row label="outline">
          <StatusLamp value="fail" variant="outline" />
        </Row>
      </div>
    </div>
  </Surface>
)
