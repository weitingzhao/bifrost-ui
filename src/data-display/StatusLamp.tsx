export type Reachability = 'ok' | 'degraded' | 'fail' | 'unknown'
export type AuthStatus = 'ok' | 'missing' | 'invalid' | 'skipped' | 'blocked'

const reachClass: Record<Reachability, string> = {
  ok: 'lamp-ok',
  degraded: 'lamp-degraded',
  fail: 'lamp-fail',
  unknown: 'lamp-unknown',
}

const authClass: Record<AuthStatus, string> = {
  ok: 'lamp-ok',
  missing: 'lamp-degraded',
  invalid: 'lamp-fail',
  skipped: 'lamp-unknown',
  blocked: 'lamp-fail',
}

export function StatusLamp({
  value,
  kind = 'reach',
  variant = 'filled',
}: {
  value: Reachability | AuthStatus
  kind?: 'reach' | 'auth'
  /** filled = solid disc (default). outline = hollow ring — e.g. unselected cluster category cards. */
  variant?: 'filled' | 'outline'
}) {
  const cls =
    kind === 'auth' ? authClass[value as AuthStatus] : reachClass[value as Reachability]
  if (variant === 'outline') {
    return (
      <span
        className={`status-lamp status-lamp--outline ${cls}`}
        aria-hidden
      />
    )
  }
  return (
    <span className={`status-lamp status-lamp--filled ${cls}`} aria-hidden>
      ●
    </span>
  )
}
