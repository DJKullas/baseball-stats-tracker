import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeamSettings } from "@/components/team/team-settings"
import { updateTeam } from "../actions"

interface PageProps {
  params: Promise<{ teamId: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { teamId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("user_id", user.id)
    .single()

  if (error || !team) {
    redirect("/dashboard")
  }

  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

  const handleUpdateTeam = async (updates: { name?: string; is_public?: boolean }) => {
    "use server"
    await updateTeam(teamId, updates)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team Settings</h1>
        <p className="text-muted-foreground">Manage your team's settings and SMS upload configuration</p>
      </div>

      <TeamSettings team={team} twilioPhoneNumber={twilioPhoneNumber} onUpdateTeam={handleUpdateTeam} />
    </div>
  )
}
