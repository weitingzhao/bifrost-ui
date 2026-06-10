import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ShellSidebarState = 'expanded' | 'collapsed'

type ShellSidebarContextValue = {
  state: ShellSidebarState
  open: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

const ShellSidebarContext = createContext<ShellSidebarContextValue | null>(null)

const SIDEBAR_COOKIE = 'bifrost_shell_sidebar'

function readSidebarCookie(defaultOpen = true): boolean {
  if (typeof document === 'undefined') return defaultOpen
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${SIDEBAR_COOKIE}=([^;]*)`))
  if (!match) return defaultOpen
  return match[1] === 'open'
}

function writeSidebarCookie(open: boolean) {
  if (typeof document === 'undefined') return
  document.cookie = `${SIDEBAR_COOKIE}=${open ? 'open' : 'closed'}; path=/; max-age=31536000; SameSite=Lax`
}

export function ShellSidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpenState] = useState(() => readSidebarCookie(defaultOpen))

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next)
    writeSidebarCookie(next)
  }, [])

  const toggle = useCallback(() => {
    setOpen(!open)
  }, [open, setOpen])

  const value = useMemo(
    (): ShellSidebarContextValue => ({
      state: open ? 'expanded' : 'collapsed',
      open,
      toggle,
      setOpen,
    }),
    [open, toggle, setOpen],
  )

  return <ShellSidebarContext.Provider value={value}>{children}</ShellSidebarContext.Provider>
}

export function useShellSidebar(): ShellSidebarContextValue {
  const ctx = useContext(ShellSidebarContext)
  if (ctx == null) {
    throw new Error('useShellSidebar must be used within ShellSidebarProvider')
  }
  return ctx
}

export function useShellSidebarOptional(): ShellSidebarContextValue | null {
  return useContext(ShellSidebarContext)
}
