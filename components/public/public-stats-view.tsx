"use client"

import type { Season, ResultWithRelations, Player, GameWithRelations } from "@/lib/types"
import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type AggregatedStats = {
  [key: string]: any
  PA: number
  AB: number
  R: number
  H: number
  RBI: number
  BB: number
  SO: number
  HBP: number
  SF: number
  "1B": number
  "2B": number
  "3B": number
  HR: number
}

const initialStats: AggregatedStats = {
  PA: 0,
  AB: 0,
  R: 0,
  H: 0,
  RBI: 0,
  BB: 0,
  SO: 0,
  HBP: 0,
  SF: 0,
  "1B": 0,
  "2B": 0,
  "3B": 0,
  HR: 0,
}

export default function PublicStatsView({
  seasons,
  results,
  players,
  games,
  teamName,
}: {
  seasons: Season[]
  results: ResultWithRelations[]
  players: Player[]
  games: GameWithRelations[]
  teamName: string
}) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("all")
  const [selectedGameId, setSelectedGameId] = useState<string>("all")

  const availableGames = useMemo(() => {
    if (selectedSeasonId === "all") return games
    return games.filter((g) => g.season_id === selectedSeasonId)
  }, [selectedSeasonId, games])

  const filteredResults = useMemo(() => {
    if (selectedGameId !== "all") {
      return results.filter((r) => r.game_id === selectedGameId)
    }
    if (selectedSeasonId !== "all") {
      return results.filter((r) => r.season_id === selectedSeasonId)
    }
    return results
  }, [selectedSeasonId, selectedGameId, results])

  const aggregatedStats = useMemo(() => {
    const playerStats: Record<string, AggregatedStats> = {}

    players.forEach((p) => {
      playerStats[p.id] = { ...initialStats }
    })

    filteredResults.forEach((result) => {
      if (!playerStats[result.player_id]) {
        playerStats[result.player_id] = { ...initialStats }
      }
      const stats = result.stats as Partial<AggregatedStats>
      for (const key in stats) {
        if (key in playerStats[result.player_id] && typeof stats[key as keyof AggregatedStats] === "number") {
          playerStats[result.player_id][key as keyof AggregatedStats] += stats[key as keyof AggregatedStats] || 0
        }
      }
    })

    return playerStats
  }, [filteredResults, players])

  const playersToDisplay = useMemo(() => {
    if (selectedGameId !== "all") {
      // If a specific game is selected, only show players who have a result for that game.
      const playerIdsInGame = new Set(filteredResults.map((r) => r.player_id))
      return players.filter((p) => playerIdsInGame.has(p.id))
    }
    // Otherwise (for a season or all seasons), show all players on the roster.
    return players
  }, [selectedGameId, filteredResults, players])

  const getBattingAverage = (H: number, AB: number) => {
    if (AB === 0) return ".000"
    return (H / AB).toFixed(3).toString()
  }

  const getOnBasePercentage = (H: number, BB: number, HBP: number, AB: number, SF: number) => {
    const totalPlateAppearances = AB + BB + HBP + SF
    if (totalPlateAppearances === 0) return ".000"
    return ((H + BB + HBP) / totalPlateAppearances).toFixed(3).toString()
  }

  const getSluggingPercentage = (singles: number, doubles: number, triples: number, homeRuns: number, AB: number) => {
    if (AB === 0) return ".000"
    const totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4
    return (totalBases / AB).toFixed(3).toString()
  }

  const getSelectedPeriodName = () => {
    if (selectedGameId !== "all") {
      const game = games.find((g) => g.id === selectedGameId)
      return game ? `Game on ${format(new Date(game.game_date), "MMMM d, yyyy")}` : "Selected Game"
    }
    if (selectedSeasonId !== "all") {
      return seasons.find((s) => s.id === selectedSeasonId)?.name || "Selected Season"
    }
    return "All Seasons"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Player Statistics</CardTitle>
            <CardDescription>
              Viewing stats for {teamName} - {getSelectedPeriodName()}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedSeasonId}
              onValueChange={(value) => {
                setSelectedSeasonId(value)
                setSelectedGameId("all") // Reset game when season changes
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select a season" />
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
            <Select value={selectedGameId} onValueChange={setSelectedGameId}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games in Season</SelectItem>
                {availableGames.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    Game on {format(new Date(game.game_date), "MM/dd/yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">PA</TableHead>
              <TableHead className="text-right">AB</TableHead>
              <TableHead className="text-right">R</TableHead>
              <TableHead className="text-right">H</TableHead>
              <TableHead className="text-right">1B</TableHead>
              <TableHead className="text-right">2B</TableHead>
              <TableHead className="text-right">3B</TableHead>
              <TableHead className="text-right">HR</TableHead>
              <TableHead className="text-right">RBI</TableHead>
              <TableHead className="text-right">BB</TableHead>
              <TableHead className="text-right">SO</TableHead>
              <TableHead className="text-right">HBP</TableHead>
              <TableHead className="text-right">SF</TableHead>
              <TableHead className="text-right">AVG</TableHead>
              <TableHead className="text-right">OBP</TableHead>
              <TableHead className="text-right">SLG</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playersToDisplay.map((player) => {
              const stats = aggregatedStats[player.id]
              if (!stats) return null // Safety check
              return (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-right">{stats.PA}</TableCell>
                  <TableCell className="text-right">{stats.AB}</TableCell>
                  <TableCell className="text-right">{stats.R}</TableCell>
                  <TableCell className="text-right">{stats.H}</TableCell>
                  <TableCell className="text-right">{stats["1B"]}</TableCell>
                  <TableCell className="text-right">{stats["2B"]}</TableCell>
                  <TableCell className="text-right">{stats["3B"]}</TableCell>
                  <TableCell className="text-right">{stats.HR}</TableCell>
                  <TableCell className="text-right">{stats.RBI}</TableCell>
                  <TableCell className="text-right">{stats.BB}</TableCell>
                  <TableCell className="text-right">{stats.SO}</TableCell>
                  <TableCell className="text-right">{stats.HBP}</TableCell>
                  <TableCell className="text-right">{stats.SF}</TableCell>
                  <TableCell className="text-right font-mono">{getBattingAverage(stats.H, stats.AB)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {getOnBasePercentage(stats.H, stats.BB, stats.HBP, stats.AB, stats.SF)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {getSluggingPercentage(stats["1B"], stats["2B"], stats["3B"], stats.HR, stats.AB)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
