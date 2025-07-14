import { createClient } from "@/lib/supabase/server"
import { getAuthStatus } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import TeamSettings from "@/components/team/team-settings"

export default async function TeamSettingsPage({ params }: { params: { teamId: string } }) {
  const { isLoggedIn, user } = await getAuthStatus()

  if (!isLoggedIn) {
    redirect("/login")
  }

  const supabase = createClient()

  // Verify the user owns this team
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, sms_code, whitelisted_numbers")
    .eq("id", params.teamId)
    .eq("user_id", user!.id)
    .single()

  if (!team) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Settings</h1>
        <p className="text-muted-foreground">Configure SMS settings and manage access for {team.name}.</p>
      </div>
      <TeamSettings
        teamId={team.id}
        smsCode={team.sms_code}
        initialWhitelistedNumbers={team.whitelisted_numbers}
        twilioPhoneNumber={process.env.TWILIO_PHONE_NUMBER}
      />
    </div>
  )
}
