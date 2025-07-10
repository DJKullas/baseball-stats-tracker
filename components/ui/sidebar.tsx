"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"

type SidebarContextType = { open: boolean; toggle: () => void }
const SidebarContext = React.createContext<SidebarContextType | null>(null)

export function SidebarProvider({ children, isMobile }: { children: React.ReactNode; isMobile: boolean }) {
  const [open, setOpen] = React.useState(!isMobile)
  const toggle = () => setOpen((o) => !o)

  React.useEffect(() => {
    setOpen(!isMobile)
  }, [isMobile])

  return <SidebarContext.Provider value={{ open, toggle }}>{children}</SidebarContext.Provider>
}

function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider>")
  return ctx
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle } = useSidebar()
  return (
    <button
      onClick={toggle}
      className={cn("inline-flex items-center justify-center p-2 rounded-md text-sm lg:hidden", className)}
      aria-label="Toggle sidebar"
    >
      <Menu className="h-6 w-6" />
    </button>
  )
}

export function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open } = useSidebar()
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform lg:static lg:translate-x-0 flex flex-col",
        open ? "translate-x-0" : "-translate-x-full",
        className,
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <header className={cn("flex h-14 items-center border-b px-4", className)}>{children}</header>
}

export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <footer className={cn("mt-auto border-t p-4", className)}>{children}</footer>
}

export function SidebarMain({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto", className)}>{children}</div>
}

export function SidebarNav({ children }: { children: React.ReactNode }) {
  return <nav className="grid gap-1">{children}</nav>
}

export function SidebarNavLink({
  href,
  children,
  active,
}: {
  href: string
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        active && "bg-muted text-primary",
      )}
    >
      {children}
    </Link>
  )
}
