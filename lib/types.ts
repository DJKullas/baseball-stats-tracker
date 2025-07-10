import type { Database } from "./database.types"

export type Team = Database["public"]["Tables"]["teams"]["Row"]
export type Player = Database["public"]["Tables"]["players"]["Row"]
export type Season = Database["public"]["Tables"]["seasons"]["Row"]
export type Result = Database["public"]["Tables"]["results"]["Row"]
export type Game = Database["public"]["Tables"]["games"]["Row"]

// This is the new primary data structure for displaying game information.
// It represents a single game and all its associated data.
export type GameWithRelations = Game & {
  results: (Result & {
    players: { name: string } | null
  })[]
  seasons: { name: string } | null
}

// A helper type for components that work with individual results.
export type ResultWithPlayer = Result & {
  players: { name: string } | null
}

// A reconstructed type for views that need a flat list of results.
// This is the type passed to StatsView
export type ResultWithRelations = Result & {
  game_id: string
  game_date: string
  season_id: string
  players: { name: string } | null
  seasons: { name: string } | null
}
