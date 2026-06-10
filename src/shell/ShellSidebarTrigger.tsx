import { useShellSidebarOptional } from './ShellSidebarContext'

export function ShellSidebarTrigger({
  className = '',
  label = 'Toggle sidebar',
}: {
  className?: string
  label?: string
}) {
  const ctx = useShellSidebarOptional()
  if (ctx == null) return null

  return (
    <button
      type="button"
      className={`shell-sidebar-trigger ${className}`.trim()}
      aria-label={label}
      aria-expanded={ctx.open}
      onClick={ctx.toggle}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </svg>
    </button>
  )
}
