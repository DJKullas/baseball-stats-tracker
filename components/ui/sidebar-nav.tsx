import type { ReactNode } from "react"

/**
 * Primary container for links inside the sidebar.
 * Keeps spacing consistent and is easy to style in one place.
 */
export function SidebarNavMain({ children }: { children: ReactNode }) {
  return (
    <nav className="flex flex-col gap-1 px-2 py-3" aria-label="Sidebar main navigation">
      {children}
    </nav>
  )
}

/**
 * Small, muted heading that groups related links.
 * Example: “Team”, “Account”, “Support”
 */
export function SidebarNavHeaderTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>
}
