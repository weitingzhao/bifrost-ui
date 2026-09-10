import { HealthLamp } from '@bifrost/ui'

/* @bifrost/ui is a dark-only system — the same palette is declared on `:root`
   and `.dark`, so there is no light variant. The preview card frame is light,
   so every cell paints the DS ground itself. */
function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-background p-4 text-foreground">{children}</div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <span className="text-dense-body text-muted-foreground">{label}</span>
    </div>
  )
}

/** The four readings, in the pulse (default) variant — a heartbeat icon sized
    for a status row beside a stream name. */
export const Readings = () => (
  <Surface>
    <div className="flex flex-col gap-2.5">
      <Row label="ib_ingestor — streaming, 1,204 msg/s">
        <HealthLamp lamp="green" title="Healthy" />
      </Row>
      <Row label="polygon_ws — reconnecting, last tick 42s ago">
        <HealthLamp lamp="yellow" title="Degraded" />
      </Row>
      <Row label="ib_operator — socket closed by peer">
        <HealthLamp lamp="red" title="Failed" />
      </Row>
      <Row label="flex_query — no report window yet today">
        <HealthLamp lamp="gray" title="Unknown" />
      </Row>
    </div>
  </Surface>
)

/** `variant="dot"` — the compact round lamp for tight nav rows and table cells,
    where a 14px heartbeat icon is too much ink. */
export const DotVariant = () => (
  <Surface>
    <div className="flex flex-col gap-2.5">
      <Row label="Live">
        <HealthLamp lamp="green" variant="dot" title="Healthy" />
      </Row>
      <Row label="Market Data">
        <HealthLamp lamp="yellow" variant="dot" title="Degraded" />
      </Row>
      <Row label="Daemon">
        <HealthLamp lamp="red" variant="dot" title="Failed" />
      </Row>
      <Row label="Flex Query">
        <HealthLamp lamp="gray" variant="dot" title="Unknown" />
      </Row>
    </div>
  </Surface>
)

/** Any unrecognised reading — including the literal string `none` — normalises
    to grey. Not knowing is its own state; it is never rendered as a failure. */
export const UnknownNormalises = () => (
  <Surface>
    <div className="flex items-center gap-4">
      <Row label={'lamp="none"'}>
        <HealthLamp lamp="none" title="Unknown" />
      </Row>
      <Row label={'lamp="pending"'}>
        <HealthLamp lamp="pending" title="Unknown" />
      </Row>
      <Row label={'lamp=""'}>
        <HealthLamp lamp="" title="Unknown" />
      </Row>
    </div>
  </Surface>
)
