"use client"

import type { Season, ResultWithRelations, Player } from "@/lib/types"
import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import EditPlayerStatsDialog from "./edit-player-stats-dialog"

type AggregatedStats = {
  [key: string]: any
  GP: number // Games Played
  PA: number
  AB: number
  R: number
  H: number
  RBI: number
  BB: number
  SO: number
  "1B": number
  "2B": number
  "3B": number
  HR: number
  HBP: number
  SF: number
  SAC: number
}

const initialStats: AggregatedStats = {
  GP: 0,
  PA: 0,
  AB: 0,
  R: 0,
  H: 0,
  RBI: 0,
  BB: 0,
  SO: 0,
  "1B": 0,
  "2B": 0,
  "3B": 0,
  HR: 0,
  HBP: 0,
  SF: 0,
  SAC: 0,
}

const wobaWeights = { wBB: 0.69, wHBP: 0.72, w1B: 0.89, w2B: 1.27, w3B: 1.62, wHR: 2.1 }

export default function StatsView({
  teamId,
  seasons,
  results,
  players,
  onDataShouldRefresh,
}: {
  teamId: string
  seasons: Season[]
  results: ResultWithRelations[]
  players: Player[]
  onDataShouldRefresh: () => void
}) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(seasons[0]?.id || "all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const filteredResults = useMemo(() => {
    if (selectedSeasonId === "all") return results
    return results.filter((r) => r.season_id === selectedSeasonId)
  }, [selectedSeasonId, results])

  const aggregatedStats = useMemo(() => {
    const playerStats: Record<string, AggregatedStats> = {}
    const gamesPlayed = new Map<string, Set<string>>()

    // Initialize all players with initial stats
    players.forEach((p) => {
      playerStats[p.id] = { ...initialStats }
      gamesPlayed.set(p.id, new Set())
    })

    // Aggregate stats from filtered results
    filteredResults.forEach((result) => {
      if (!playerStats[result.player_id]) {
        playerStats[result.player_id] = { ...initialStats }
      }
      if (!gamesPlayed.has(result.player_id)) {
        gamesPlayed.set(result.player_id, new Set())
      }

      // Aggregate individual stats
      const stats = result.stats as Partial<AggregatedStats>
      for (const key in stats) {
        if (key in playerStats[result.player_id] && typeof stats[key as keyof AggregatedStats] === "number") {
          playerStats[result.player_id][key as keyof AggregatedStats] += stats[key as keyof AggregatedStats] || 0
        }
      }

      // Track games played
      gamesPlayed.get(result.player_id)!.add(result.game_id)
    })

    // Add games played count to the final stats object
    for (const playerId in playerStats) {
      playerStats[playerId].GP = gamesPlayed.get(playerId)?.size || 0
    }

    return playerStats
  }, [filteredResults, players])

  const formatStat = (num: number) => (num === 0 ? ".000" : num.toFixed(3).toString())

  const calculatedStats = useMemo(() => {
    return players
      .map((player) => {
        const stats = aggregatedStats[player.id]
        // Show all players, even with 0 stats.
        if (!stats)
          return { playerId: player.id, name: player.name, ...initialStats, AVG: 0, OBP: 0, SLG: 0, OPS: 0, wOBA: 0 }

        const singles = stats.H - (stats["2B"] + stats["3B"] + stats.HR)
        const obp = stats.PA > 0 ? (stats.H + stats.BB + stats.HBP) / stats.PA : 0
        const slg = stats.AB > 0 ? (singles + stats["2B"] * 2 + stats["3B"] * 3 + stats.HR * 4) / stats.AB : 0
        const avg = stats.AB > 0 ? stats.H / stats.AB : 0
        const ops = obp + slg
        const wobaNumerator =
          wobaWeights.wBB * stats.BB +
          wobaWeights.wHBP * stats.HBP +
          wobaWeights.w1B * singles +
          wobaWeights.w2B * stats["2B"] +
          wobaWeights.w3B * stats["3B"] +
          wobaWeights.wHR * stats.HR
        const wobaDenominator = stats.AB + stats.BB + stats.SF + stats.HBP
        const woba = wobaDenominator > 0 ? wobaNumerator / wobaDenominator : 0
        return { playerId: player.id, name: player.name, ...stats, AVG: avg, OBP: obp, SLG: slg, OPS: ops, wOBA: woba }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.OPS - a.OPS)
  }, [aggregatedStats, players])

  const statLeaders = useMemo(() => {
    if (calculatedStats.length === 0) return {}
    const leaders: Record<string, number> = {}
    const statKeys = [
      "GP",
      "PA",
      "AB",
      "R",
      "H",
      "2B",
      "3B",
      "HR",
      "RBI",
      "BB",
      "SO",
      "AVG",
      "OBP",
      "SLG",
      "OPS",
      "wOBA",
    ]
    statKeys.forEach((key) => {
      leaders[key] = Math.max(...calculatedStats.map((p) => p[key as keyof typeof p] as number))
    })
    return leaders
  }, [calculatedStats])

  const handleEditClick = (playerId: string) => {
    const player = players.find((p) => p.id === playerId)
    if (player) {
      setSelectedPlayer(player)
      setIsEditDialogOpen(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Player Statistics</CardTitle>
              <CardDescription>
                Detailed batting stats for the selected season. Leaders are highlighted.
              </CardDescription>
            </div>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] sticky left-0 bg-card z-10">Player</TableHead>
                <TableHead className="text-right">GP</TableHead>
                <TableHead className="text-right">PA</TableHead>
                <TableHead className="text-right">AB</TableHead>
                <TableHead className="text-right">R</TableHead>
                <TableHead className="text-right">H</TableHead>
                <TableHead className="text-right">2B</TableHead>
                <TableHead className="text-right">3B</TableHead>
                <TableHead className="text-right">HR</TableHead>
                <TableHead className="text-right">RBI</TableHead>
                <TableHead className="text-right">BB</TableHead>
                <TableHead className="text-right">SO</TableHead>
                <TableHead className="text-right font-bold">AVG</TableHead>
                <TableHead className="text-right font-bold">OBP</TableHead>
                <TableHead className="text-right font-bold">SLG</TableHead>
                <TableHead className="text-right font-bold">OPS</TableHead>
                <TableHead className="text-right font-bold text-primary">wOBA</TableHead>
                <TableHead className="text-right sticky right-0 bg-card z-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculatedStats.length > 0 ? (
                calculatedStats.map((p) => (
                  <TableRow key={p.playerId}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10">{p.name}</TableCell>
                    <TableCell className={cn("text-right", p.GP === statLeaders.GP && "bg-primary/10 font-bold")}>
                      {p.GP}
                    </TableCell>
                    <TableCell className={cn("text-right", p.PA === statLeaders.PA && "bg-primary/10 font-bold")}>
                      {p.PA}
                    </TableCell>
                    <TableCell className={cn("text-right", p.AB === statLeaders.AB && "bg-primary/10 font-bold")}>
                      {p.AB}
                    </TableCell>
                    <TableCell className={cn("text-right", p.R === statLeaders.R && "bg-primary/10 font-bold")}>
                      {p.R}
                    </TableCell>
                    <TableCell className={cn("text-right", p.H === statLeaders.H && "bg-primary/10 font-bold")}>
                      {p.H}
                    </TableCell>
                    <TableCell className={cn("text-right", p["2B"] === statLeaders["2B"] && "bg-primary/10 font-bold")}>
                      {p["2B"]}
                    </TableCell>
                    <TableCell className={cn("text-right", p["3B"] === statLeaders["3B"] && "bg-primary/10 font-bold")}>
                      {p["3B"]}
                    </TableCell>
                    <TableCell className={cn("text-right", p.HR === statLeaders.HR && "bg-primary/10 font-bold")}>
                      {p.HR}
                    </TableCell>
                    <TableCell className={cn("text-right", p.RBI === statLeaders.RBI && "bg-primary/10 font-bold")}>
                      {p.RBI}
                    </TableCell>
                    <TableCell className={cn("text-right", p.BB === statLeaders.BB && "bg-primary/10 font-bold")}>
                      {p.BB}
                    </TableCell>
                    <TableCell className={cn("text-right", p.SO === statLeaders.SO && "bg-primary/10 font-bold")}>
                      {p.SO}
                    </TableCell>
                    <TableCell
                      className={cn("text-right font-mono font-bold", p.AVG === statLeaders.AVG && "bg-primary/10")}
                    >
                      {formatStat(p.AVG)}
                    </TableCell>
                    <TableCell
                      className={cn("text-right font-mono font-bold", p.OBP === statLeaders.OBP && "bg-primary/10")}
                    >
                      {formatStat(p.OBP)}
                    </TableCell>
                    <TableCell
                      className={cn("text-right font-mono font-bold", p.SLG === statLeaders.SLG && "bg-primary/10")}
                    >
                      {formatStat(p.SLG)}
                    </TableCell>
                    <TableCell
                      className={cn("text-right font-mono font-bold", p.OPS === statLeaders.OPS && "bg-primary/10")}
                    >
                      {formatStat(p.OPS)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-bold text-primary",
                        p.wOBA === statLeaders.wOBA && "bg-primary/20",
                      )}
                    >
                      {formatStat(p.wOBA)}
                    </TableCell>
                    <TableCell className="sticky right-0 bg-card z-10">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(p.playerId)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={18} className="h-24 text-center">
                    No players on this team yet. Add one from the Roster tab.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedPlayer && (
        <EditPlayerStatsDialog
          teamId={teamId}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          player={selectedPlayer}
          playerResults={results.filter((r) => r.player_id === selectedPlayer.id)}
          onStatsUpdated={onDataShouldRefresh}
        />
      )}
    </>
  )
}
