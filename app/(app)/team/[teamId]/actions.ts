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

export async function updatePlayerName(teamId: string, playerId: string, newName: string) {
  const supabase = createServerClient()

  try {
    console.log("=== UPDATE PLAYER NAME DEBUG ===")
    console.log("Input params:", { teamId, playerId, newName })

    // Get the current user to check permissions
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    console.log("Current user:", user?.id, userError)

    // Check if user has access to this team
    const { data: teamAccess, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .eq("user_id", user?.id)
      .single()

    console.log("Team access check:", { teamAccess, teamError })

    // Try using RPC function approach to bypass RLS
    const { data: rpcResult, error: rpcError } = await supabase.rpc("update_player_name", {
      p_team_id: teamId,
      p_player_id: playerId,
      p_new_name: newName,
    })

    console.log("RPC result:", { rpcResult, rpcError })

    if (rpcError) {
      // Fallback to direct update with explicit team ownership check
      console.log("RPC failed, trying direct update...")

      // First verify we own this team
      if (!teamAccess) {
        return { success: false, error: "Access denied: You don't own this team" }
      }

      // Try the update with explicit ownership verification
      const { data: updatedPlayers, error: updateError } = await supabase
        .from("players")
        .update({ name: newName })
        .eq("id", playerId)
        .eq("team_id", teamId)
        .select()

      console.log("Direct update result:", { updatedPlayers, updateError })

      if (updateError) {
        throw updateError
      }

      if (!updatedPlayers || updatedPlayers.length === 0) {
        return { success: false, error: "Failed to update player - no rows affected" }
      }

      revalidatePath(`/team/${teamId}`)
      return { success: true, data: updatedPlayers[0] }
    }

    // RPC succeeded
    revalidatePath(`/team/${teamId}`)
    return { success: true, data: rpcResult }
  } catch (error: any) {
    console.error("Error updating player name:", error)
    return { success: false, error: error.message || "Failed to update player name." }
  }
}

export async function mergePlayers(teamId: string, sourcePlayerId: string, targetPlayerId: string) {
  const supabase = createServerClient()

  try {
    console.log("Starting player merge:", { teamId, sourcePlayerId, targetPlayerId })

    // Get the current user to check permissions
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Check if user has access to this team
    const { data: teamAccess, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .eq("user_id", user.id)
      .single()

    if (teamError || !teamAccess) {
      return { success: false, error: "Access denied: You don't own this team" }
    }

    // First, verify both players exist and belong to the team
    const { data: sourcePlayer, error: sourceError } = await supabase
      .from("players")
      .select("*")
      .eq("id", sourcePlayerId)
      .eq("team_id", teamId)
      .single()

    if (sourceError || !sourcePlayer) {
      console.error("Source player not found:", sourceError)
      return { success: false, error: "Source player not found" }
    }

    const { data: targetPlayer, error: targetError } = await supabase
      .from("players")
      .select("*")
      .eq("id", targetPlayerId)
      .eq("team_id", teamId)
      .single()

    if (targetError || !targetPlayer) {
      console.error("Target player not found:", targetError)
      return { success: false, error: "Target player not found" }
    }

    console.log("Both players found:", { sourcePlayer: sourcePlayer.name, targetPlayer: targetPlayer.name })

    // Get all results for both players
    const { data: sourceResults, error: sourceResultsError } = await supabase
      .from("results")
      .select("*")
      .eq("player_id", sourcePlayerId)

    if (sourceResultsError) {
      console.error("Error fetching source results:", sourceResultsError)
      throw sourceResultsError
    }

    const { data: targetResults, error: targetResultsError } = await supabase
      .from("results")
      .select("*")
      .eq("player_id", targetPlayerId)

    if (targetResultsError) {
      console.error("Error fetching target results:", targetResultsError)
      throw targetResultsError
    }

    console.log("Results found:", {
      sourceResultsCount: sourceResults?.length || 0,
      targetResultsCount: targetResults?.length || 0,
    })

    // Check for conflicts (same game_id for both players)
    const sourceGameIds = new Set(sourceResults?.map((r) => r.game_id) || [])
    const targetGameIds = new Set(targetResults?.map((r) => r.game_id) || [])
    const conflictingGameIds = [...sourceGameIds].filter((gameId) => targetGameIds.has(gameId))

    console.log("Conflicting games:", conflictingGameIds)

    // If there are conflicts, delete the source player's results for those games
    // (keeping the target player's results)
    if (conflictingGameIds.length > 0) {
      console.log("Deleting conflicting source results for games:", conflictingGameIds)
      const { error: deleteConflictsError } = await supabase
        .from("results")
        .delete()
        .eq("player_id", sourcePlayerId)
        .in("game_id", conflictingGameIds)

      if (deleteConflictsError) {
        console.error("Error deleting conflicting results:", deleteConflictsError)
        throw deleteConflictsError
      }
    }

    // Get remaining source results (after conflict deletion)
    const { data: remainingSourceResults, error: remainingError } = await supabase
      .from("results")
      .select("*")
      .eq("player_id", sourcePlayerId)

    if (remainingError) {
      console.error("Error fetching remaining source results:", remainingError)
      throw remainingError
    }

    console.log("Remaining source results to transfer:", remainingSourceResults?.length || 0)

    // Move all remaining results from source player to target player
    if (remainingSourceResults && remainingSourceResults.length > 0) {
      const { error: updateError } = await supabase
        .from("results")
        .update({ player_id: targetPlayerId })
        .eq("player_id", sourcePlayerId)

      if (updateError) {
        console.error("Error updating results:", updateError)
        throw updateError
      }
      console.log("Successfully transferred results to target player")
    }

    // Delete the source player
    console.log("Deleting source player:", sourcePlayer.name)
    const { error: deletePlayerError } = await supabase
      .from("players")
      .delete()
      .eq("id", sourcePlayerId)
      .eq("team_id", teamId)

    if (deletePlayerError) {
      console.error("Error deleting source player:", deletePlayerError)
      throw deletePlayerError
    }

    console.log("Player merge completed successfully")
    revalidatePath(`/team/${teamId}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error merging players:", error)
    return { success: false, error: error.message || "Failed to merge players." }
  }
}
