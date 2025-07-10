"use client"

import type React from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/dashboard/sidebar"
import Header from "@/components/dashboard/header"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import type { Team, User } from "@/lib/types"

interface AppShellProps {
  children: React.ReactNode
  user: User
  teams: Team[]
}

export default function AppShell({ children, user, teams }: AppShellProps) {
  const isMobile = useIsMobile()

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider isMobile={isMobile}>
        <div className="flex min-h-screen w-full">
          <AppSidebar user={user} teams={teams} />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">{children}</main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  )
}
