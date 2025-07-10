"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as z from "zod"
import type { GameWithRelations, Player } from "@/lib/types"
import { processImage } from "@/lib/ai-processing"

const statSchema = z.object({
  playerId: z.string().min(1, "Player is required."),
  PA: z.coerce.number().int().min(0).default(0),
  AB: z.coerce.number().int().min(0).default(0),
  R: z.coerce.number().int().min(0).default(0),
  H: z.coerce.number().int().min(0).default(0),
  RBI: z.coerce.number().int().min(0).default(0),
  BB: z.coerce.number().int().min(0).default(0),
  SO: z.coerce.number().int().min(0).default(0),
  HBP: z.coerce.number().int().min(0).default(0),
  SF: z.coerce.number().int().min(0).default(0),
  "1B": z.coerce.number().int().min(0).default(0),
  "2B": z.coerce.number().int().min(0).default(0),
  "3B": z.coerce.number().int().min(0).default(0),
  HR: z.coerce.number().int().min(0).default(0),
})

const gameFormSchema = z.object({
  seasonId: z.string(),
  gameDate: z.date(),
  playerStats: z.array(statSchema),
})

const playerStatsUpdateSchema = z.array(
  z.object({
    resultId: z.string().optional(),
    playerId: z.string().min(1),
    PA: z.coerce.number().int().min(0).default(0),
    AB: z.coerce.number().int().min(0).default(0),
    H: z.coerce.number().int().min(0).default(0),
    RBI: z.coerce.number().int().min(0).default(0),
    BB: z.coerce.number().int().min(0).default(0),
    SO: z.coerce.number().int().min(0).default(0),
  }),
)

async function getOrCreatePlayer(teamId: string, playerNameOrId: string): Promise<[Player, boolean]> {
  const supabase = createServerClient()
  // If the value is already a UUID, we can assume it's an existing player.
  if (z.string().uuid().safeParse(playerNameOrId).success) {
    const { data: player, error } = await supabase.from("players").select("*").eq("id", playerNameOrId).single()
    if (error || !player) throw new Error(`Player with ID ${playerNameOrId} not found.`)
    return [player, false] // It's an existing player
  }

  const playerName = playerNameOrId.trim()
  if (!playerName) {
    throw new Error("Player name cannot be empty.")
  }

  // First, try to find an existing player with that name.
  const { data: existingPlayers, error: findError } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .ilike("name", playerName)

  if (findError) {
    throw new Error(`Database error when searching for player "${playerName}": ${findError.message}`)
  }

  if (existingPlayers && existingPlayers.length > 0) {
    return [existingPlayers[0], false] // It's an existing player
  }

  // If no player was found, we proceed to create a new one.
  const { data: newPlayer, error: createError } = await supabase
    .from("players")
    .insert({ team_id: teamId, name: playerName })
    .select("*")
    .single()

  if (createError || !newPlayer) {
    throw new Error(`Failed to create new player "${playerName}": ${createError.message}`)
  }

  return [newPlayer, true] // It's a new player
}

export async function addGameResults(teamId: string, values: z.infer<typeof gameFormSchema>) {
  const supabase = createServerClient()
  try {
    const { data: newGame, error: gameError } = await supabase
      .from("games")
      .insert({
        team_id: teamId,
        season_id: values.seasonId,
        game_date: values.gameDate.toISOString(),
        source: "manual",
      })
      .select()
      .single()
    if (gameError) throw new Error("Failed to create game entry.")

    const newPlayers: Player[] = []
    const resultsToInsert = await Promise.all(
      values.playerStats.map(async (stat) => {
        const [player, isNew] = await getOrCreatePlayer(teamId, stat.playerId)
        if (isNew) {
          newPlayers.push(player)
        }
        const { playerId: _, ...restOfStats } = stat
        return { game_id: newGame.id, player_id: player.id, stats: restOfStats }
      }),
    )

    if (resultsToInsert.length > 0) {
      const { error: resultsError } = await supabase.from("results").insert(resultsToInsert)
      if (resultsError) {
        await supabase.from("games").delete().eq("id", newGame.id)
        throw new Error("Failed to save game stats.")
      }
    }

    const { data: gameWithRelations, error: finalFetchError } = await supabase
      .from("games")
      .select("*, results(*, players(*)), seasons(name)")
      .eq("id", newGame.id)
      .single()
    if (finalFetchError) throw new Error("Game created, but failed to fetch updated data.")

    revalidatePath(`/team/${teamId}`)
    return { success: true, data: { newGame: gameWithRelations as GameWithRelations, newPlayers } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteGame(gameId: string, teamId: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("games").delete().eq("id", gameId)
  if (error) return { success: false, error: "Failed to delete game." }
  revalidatePath(`/team/${teamId}`)
  return { success: true }
}

export async function updateGameResults(
  gameId: string,
  teamId: string,
  playerStats: z.infer<typeof playerStatsUpdateSchema>,
) {
  const supabase = createServerClient()
  try {
    const newPlayers: Player[] = []
    const resolvedPlayerStats = await Promise.all(
      playerStats.map(async (stat) => {
        const [player, isNew] = await getOrCreatePlayer(teamId, stat.playerId)
        if (isNew) {
          newPlayers.push(player)
        }
        return { ...stat, playerId: player.id }
      }),
    )

    const { error: deleteError } = await supabase.from("results").delete().eq("game_id", gameId)
    if (deleteError) throw deleteError

    const resultsToInsert = resolvedPlayerStats.map((stat) => {
      const { playerId, resultId: _, ...restOfStats } = stat
      return { game_id: gameId, player_id: playerId, stats: restOfStats }
    })

    if (resultsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("results").insert(resultsToInsert)
      if (insertError) throw insertError
    }

    const { data: gameWithRelations, error: finalFetchError } = await supabase
      .from("games")
      .select("*, results(*, players(*)), seasons(name)")
      .eq("id", gameId)
      .single()
    if (finalFetchError) throw finalFetchError

    revalidatePath(`/team/${teamId}`)
    return { success: true, data: { updatedGame: gameWithRelations as GameWithRelations, newPlayers } }
  } catch (error: any) {
    console.error("Error updating game:", error)
    return { success: false, error: "Failed to update game." }
  }
}

export async function processImageUrlAndCreateGame(teamId: string, seasonId: string, gameDate: Date, imageUrl: string) {
  const supabase = createServerClient()
  try {
    const statsData = await processImage(imageUrl)
    if (!statsData || statsData.length === 0) throw new Error("AI failed to process image or no stats were found.")

    const newPlayers: Player[] = []
    const playerMap = new Map<string, Player>()

    for (const playerData of statsData) {
      const playerName = playerData.playerName.trim()
      if (!playerName) continue
      if (playerMap.has(playerName.toLowerCase())) continue

      const [player, isNew] = await getOrCreatePlayer(teamId, playerName)
      if (isNew) {
        newPlayers.push(player)
      }
      playerMap.set(playerName.toLowerCase(), player)
    }

    const { data: newGame, error: gameError } = await supabase
      .from("games")
      .insert({
        team_id: teamId,
        season_id: seasonId,
        game_date: gameDate.toISOString().split("T")[0],
        source: "upload",
      })
      .select("id")
      .single()
    if (gameError) throw new Error("Failed to create game entry.")

    const resultsToInsert = statsData
      .map((playerData) => {
        const player = playerMap.get(playerData.playerName.trim().toLowerCase())
        if (!player) return null
        return { game_id: newGame.id, player_id: player.id, stats: playerData.stats }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (resultsToInsert.length > 0) {
      const { error: resultsError } = await supabase.from("results").insert(resultsToInsert)
      if (resultsError) {
        await supabase.from("games").delete().eq("id", newGame.id)
        throw new Error("Failed to save game stats.")
      }
    }

    const { data: gameWithRelations, error: finalFetchError } = await supabase
      .from("games")
      .select("*, results(*, players(name)), seasons(name)")
      .eq("id", newGame.id)
      .single()
    if (finalFetchError) throw new Error("Game created, but failed to fetch updated data.")

    revalidatePath(`/team/${teamId}`)
    return { success: true, data: { newGame: gameWithRelations as GameWithRelations, newPlayers } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addPlayer(teamId: string, name: string) {
  const supabase = createServerClient()
  try {
    const { data, error } = await supabase.from("players").insert({ team_id: teamId, name: name }).select().single()
    if (error) return { success: false, error: "Failed to create player." }
    revalidatePath(`/team/${teamId}`)
    return { success: true, data: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addSeason(teamId: string, name: string) {
  const supabase = createServerClient()
  try {
    const { data, error } = await supabase.from("seasons").insert({ team_id: teamId, name: name }).select().single()
    if (error) return { success: false, error: "Failed to create season." }
    revalidatePath(`/team/${teamId}`)
    return { success: true, data: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updatePlayerStats(teamId: string, statsToUpdate: { resultId: string; stats: any }[]) {
  const supabase = createServerClient()
  try {
    const updates = statsToUpdate.map((item) =>
      supabase.from("results").update({ stats: item.stats }).eq("id", item.resultId),
    )
    const results = await Promise.all(updates)
    const firstError = results.find((r) => r.error)
    if (firstError) throw firstError.error
    revalidatePath(`/team/${teamId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error updating player stats:", error)
    return { success: false, error: "Failed to update player stats." }
  }
}
