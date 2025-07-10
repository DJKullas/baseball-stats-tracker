import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AppShell from "./app-shell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: teams } = await supabase.from("teams").select("*").eq("user_id", user.id).order("name")

  return (
    <AppShell user={user} teams={teams || []}>
      {children}
    </AppShell>
  )
}
