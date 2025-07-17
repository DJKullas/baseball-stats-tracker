"use client"

import type { Team, Player, Season, GameWithRelations, ResultWithRelations } from "@/lib/types"
import { useState, useMemo, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import PlayerTable from "@/components/team/player-table"
import AddPlayerForm from "@/components/team/add-player-form"
import NewSeasonDialog from "@/components/team/new-season-dialog"
import StatsView from "@/components/team/stats-view"
import GameList from "@/components/team/game-list"
import ManualEntry from "@/components/team/manual-entry"
import TeamSettings from "@/components/team/team-settings"
import ShareButton from "@/components/team/share-button"
import { useRouter } from "next/navigation"

type TeamWithPlayers = Team & {
  players: Player[]
}

export default function TeamPageClient({
  team,
  initialGames,
  initialSeasons,
}: {
  team: TeamWithPlayers
  initialGames: GameWithRelations[]
  initialSeasons: Season[]
}) {
  const [players, setPlayers] = useState<Player[]>(team.players)
  const [seasons, setSeasons] = useState<Season[]>(initialSeasons)
  const [games, setGames] = useState<GameWithRelations[]>(initialGames)
  const [selectedGameListSeasonId, setSelectedGameListSeasonId] = useState<string>("all")
  const router = useRouter()

  const filteredGames = useMemo(() => {
    if (selectedGameListSeasonId === "all") {
      return games
    }
    return games.filter((game) => game.season_id === selectedGameListSeasonId)
  }, [games, selectedGameListSeasonId])

  const handleDataShouldRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  const handlePlayerAdded = (newPlayer: Player) => {
    setPlayers((currentPlayers) => [...currentPlayers, newPlayer])
    handleDataShouldRefresh()
  }

  const handleSeasonAdded = (newSeason: Season) => {
    setSeasons((currentSeasons) => [newSeason, ...currentSeasons])
  }

  const handleGameAdded = (newGame: GameWithRelations, newPlayers: Player[] = []) => {
    setGames((currentGames) => [newGame, ...currentGames])
    if (newPlayers.length > 0) {
      setPlayers((currentPlayers) => [...currentPlayers, ...newPlayers])
    }
    handleDataShouldRefresh()
  }

  const handleGameDeleted = (gameId: string) => {
    setGames((currentGames) => currentGames.filter((g) => g.id !== gameId))
    handleDataShouldRefresh()
  }

  const handleGameUpdated = (updatedGame: GameWithRelations, newPlayers: Player[] = []) => {
    setGames((currentGames) => currentGames.map((g) => (g.id === updatedGame.id ? updatedGame : g)))
    if (newPlayers.length > 0) {
      setPlayers((currentPlayers) => [...currentPlayers, ...newPlayers])
    }
    handleDataShouldRefresh()
  }

  const results = useMemo(() => {
    return games.flatMap((game) =>
      game.results.map((result) => ({
        ...result,
        game_id: game.id,
        game_date: game.game_date,
        season_id: game.season_id,
        seasons: game.seasons,
      })),
    ) as ResultWithRelations[]
  }, [games])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
          <p className="text-muted-foreground">Manage your team, track stats, and view game history.</p>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton teamId={team.id} />
          <NewSeasonDialog teamId={team.id} onSeasonAdded={handleSeasonAdded} />
        </div>
      </div>

      <Tabs defaultValue="games">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-3 p-2 h-auto mb-8 md:mb-0">
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
        <TabsContent value="stats" className="mt-6">
          <StatsView
            teamId={team.id}
            seasons={seasons}
            results={results}
            players={players}
            onDataShouldRefresh={handleDataShouldRefresh}
          />
        </TabsContent>
        <TabsContent value="games" className="mt-6 space-y-6">
          <ManualEntry teamId={team.id} players={players} seasons={seasons} onGameAdded={handleGameAdded} />

          <div className="border-t pt-6">
            <div className="mb-4">
              <Label htmlFor="season-filter">Filter by Season</Label>
              <Select value={selectedGameListSeasonId} onValueChange={setSelectedGameListSeasonId}>
                <SelectTrigger id="season-filter" className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select a season to filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Seasons</SelectItem>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <GameList
              teamId={team.id}
              games={filteredGames}
              players={players}
              seasons={seasons}
              onGameDeleted={handleGameDeleted}
              onGameUpdated={handleGameUpdated}
            />
          </div>
        </TabsContent>
        <TabsContent value="roster" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <PlayerTable players={players} />
            <AddPlayerForm teamId={team.id} onPlayerAdded={handlePlayerAdded} />
          </div>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <TeamSettings
            teamId={team.id}
            smsCode={team.sms_code}
            initialWhitelistedNumbers={team.whitelisted_phone_numbers}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
