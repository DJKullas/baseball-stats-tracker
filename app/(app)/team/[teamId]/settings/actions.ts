"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateWhitelist(teamId: string, phoneNumbers: string[]) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Verify user owns the team
  const { data: team } = await supabase.from("teams").select("user_id").eq("id", teamId).single()
  if (!team || team.user_id !== user.id) {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase.from("teams").update({ whitelisted_phone_numbers: phoneNumbers }).eq("id", teamId)

  if (error) {
    console.error("Error updating whitelist:", error)
    return { success: false, error: "Failed to update phone numbers." }
  }

  revalidatePath(`/team/${teamId}`)
  return { success: true }
}
