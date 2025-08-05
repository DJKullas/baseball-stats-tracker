"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StatsView from "./stats-view"
import GameList from "./game-list"
import PlayerTable from "./player-table"
import TeamSettings from "./team-settings"
import type { GameWithRelations, Player, Season, Team, ResultWithRelations } from "@/lib/types"

interface TeamPageClientProps {
  team: Team
  games: GameWithRelations[]
  players: Player[]
  seasons: Season[]
  results: ResultWithRelations[]
}

export default function TeamPageClient({ team, games, players, seasons, results }: TeamPageClientProps) {
  const [activeTab, setActiveTab] = useState("stats")

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <p className="text-muted-foreground">Team Code: {team.sms_code}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-3 p-2 mb-8 md:mb-0">
          <TabsTrigger value="stats" className="h-10">
            Stats
          </TabsTrigger>
          <TabsTrigger value="games" className="h-10">
            Games & Entry
          </TabsTrigger>
          <TabsTrigger value="roster" className="h-10">
            Roster
          </TabsTrigger>
          <TabsTrigger value="settings" className="h-10">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <StatsView results={results} seasons={seasons} players={players} />
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <GameList games={games} players={players} seasons={seasons} teamId={team.id} />
        </TabsContent>

        <TabsContent value="roster" className="space-y-4">
          <PlayerTable players={players} teamId={team.id} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <TeamSettings team={team} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
