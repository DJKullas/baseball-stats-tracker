import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import TeamPageClient from "@/components/team/team-page-client"
import type { GameWithRelations, Team, Player } from "@/lib/types"

// Define a more specific type for the team data we're fetching
type TeamWithRelations = Team & {
  players: Player[]
}

export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch team and its players in a single query
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*, players(*)")
    .eq("id", params.teamId)
    .single()

  if (teamError || !team) {
    console.error("Error fetching team or team not found:", teamError)
    notFound()
  }

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select(
      `
      *,
      seasons ( name ),
      results (
        *,
        players ( name )
      )
    `,
    )
    .eq("team_id", params.teamId)
    .order("game_date", { ascending: false })

  if (gamesError) {
    console.error("Error fetching games:", gamesError)
    // Handle error appropriately, maybe return an empty array
  }

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("team_id", params.teamId)
    .order("created_at", { ascending: false })

  return (
    <TeamPageClient
      team={team as TeamWithRelations}
      initialGames={(games as GameWithRelations[]) || []}
      initialSeasons={seasons || []}
    />
  )
}
