import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PublicStatsView from "@/components/public/public-stats-view"
import type { GameWithRelations } from "@/lib/types"

export default async function PublicTeamPage({ params }: { params: { teamId: string } }) {
  const supabase = createClient()
  const { teamId } = params

  const { data: team, error: teamError } = await supabase.from("teams").select("id, name").eq("id", teamId).single()

  if (teamError || !team) {
    notFound()
  }

  const { data: players } = await supabase.from("players").select("*").eq("team_id", teamId).order("name")

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })

  const { data: games } = await supabase
    .from("games")
    .select(
      `
      id, game_date, season_id,
      seasons ( name ),
      results ( *, players ( name ) )
    `,
    )
    .eq("team_id", teamId)
    .order("game_date", { ascending: false })

  const results =
    games?.flatMap((game) =>
      game.results.map((result) => ({
        ...result,
        game_id: game.id,
        game_date: game.game_date,
        season_id: game.season_id,
        seasons: game.seasons,
      })),
    ) || []

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">{team.name} - Public Stats</h1>
      <PublicStatsView
        seasons={seasons || []}
        results={results}
        players={players || []}
        games={(games as GameWithRelations[]) || []}
        teamName={team.name}
      />
    </div>
  )
}
