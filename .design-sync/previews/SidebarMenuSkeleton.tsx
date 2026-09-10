import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
} from '@bifrost/ui'

/** Sidebar pieces read layout state from `SidebarProvider`; a leaf rendered
    outside it has no context to lay itself out against. */
function SidebarSurface({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="w-64 self-start rounded-lg border border-sidebar-border bg-sidebar p-2 text-sidebar-foreground">
        {children}
      </div>
    </SidebarProvider>
  )
}

/** The loading placeholder for a nav list whose items have not arrived yet.
    Each row's text block gets a randomised width so the stack does not read as
    a striped pattern. */
export const LoadingNav = () => (
  <SidebarSurface>
    <SidebarMenu>
      {Array.from({ length: 5 }, (_, i) => (
        <SidebarMenuItem key={i}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  </SidebarSurface>
)

/** `showIcon={false}` (the default) — for a sub-list whose real rows carry no
    icon, so the placeholder must not promise one. */
export const WithoutIcon = () => (
  <SidebarSurface>
    <SidebarMenu>
      {Array.from({ length: 4 }, (_, i) => (
        <SidebarMenuItem key={i}>
          <SidebarMenuSkeleton />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  </SidebarSurface>
)
