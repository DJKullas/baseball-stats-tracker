"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Sidebar, SidebarFooter, SidebarHeader, SidebarMain, SidebarNav, SidebarNavLink } from "@/components/ui/sidebar"
import { SidebarNavMain, SidebarNavHeaderTitle } from "@/components/ui/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Home, Users, LogOut, Contact, CreditCard } from "lucide-react"
import type { Team, User } from "@/lib/types"
import { logout } from "@/app/(app)/actions"

interface AppSidebarProps {
  user: User
  teams: Team[]
}

export default function AppSidebar({ user, teams }: AppSidebarProps) {
  const pathname = usePathname()
  const isActive = (path: string) => {
    // Exact match for dashboard
    if (path === "/dashboard") return pathname === path
    // Starts with for team pages
    return pathname.startsWith(path)
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="ScorebookSnap logo" width={24} height={24} />
          <span>ScorebookSnap</span>
        </Link>
      </SidebarHeader>

      <SidebarMain className="p-0">
        <SidebarNavMain>
          <SidebarNavLink href="/dashboard" active={pathname === "/dashboard"}>
            <Home className="h-4 w-4" />
            Dashboard
          </SidebarNavLink>

          <div className="mt-4">
            <SidebarNavHeaderTitle>Your Teams</SidebarNavHeaderTitle>
            <div className="mt-2 flex flex-col gap-1">
              {teams.map((team) => (
                <SidebarNavLink key={team.id} href={`/team/${team.id}`} active={isActive(`/team/${team.id}`)}>
                  <Users className="h-4 w-4" />
                  {team.name}
                </SidebarNavLink>
              ))}
            </div>
          </div>
        </SidebarNavMain>
      </SidebarMain>

      <SidebarFooter>
        <SidebarNav>
          <SidebarNavLink href="/contact" active={isActive("/contact")}>
            <Contact className="h-4 w-4" />
            Contact
          </SidebarNavLink>
          <SidebarNavLink href="/billing" active={isActive("/billing")}>
            <CreditCard className="h-4 w-4" />
            Billing
          </SidebarNavLink>
        </SidebarNav>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">{user.user_metadata?.full_name ?? user.email}</span>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="icon" type="submit" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
