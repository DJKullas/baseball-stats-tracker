"use client"

import type { Player, Season, GameWithRelations } from "@/lib/types"
import { useState } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteGame } from "@/app/(app)/team/[teamId]/actions"
import EditGameDialog from "./edit-game-dialog"

type GameListProps = {
  teamId: string
  games: GameWithRelations[]
  players: Player[]
  seasons: Season[]
  onGameDeleted: (gameId: string) => void
  onGameUpdated: (updatedGame: GameWithRelations) => void
}

export default function GameList({ teamId, games, players, seasons, onGameDeleted, onGameUpdated }: GameListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingGame, setEditingGame] = useState<GameWithRelations | null>(null)

  const handleDelete = async (gameId: string) => {
    setIsDeleting(gameId)
    const result = await deleteGame(gameId, teamId)
    if (result.success) {
      onGameDeleted(gameId)
    } else {
      console.error(result.error)
      // TODO: Show error toast
    }
    setIsDeleting(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game History</CardTitle>
        <CardDescription>A list of all recorded games for your team.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {games.map((game) => (
            <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{format(new Date(game.game_date), "MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">
                  {game.seasons?.name || "Unknown Season"} &middot; {game.results.length} players recorded
                </p>
              </div>
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDeleting === game.id}>
                      {isDeleting === game.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingGame(game)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the game from {format(new Date(game.game_date), "MMMM d, yyyy")}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(game.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
        {editingGame && (
          <EditGameDialog
            game={editingGame}
            players={players}
            seasons={seasons}
            isOpen={!!editingGame}
            onClose={() => setEditingGame(null)}
            onGameUpdated={onGameUpdated}
            teamId={teamId}
          />
        )}
      </CardContent>
    </Card>
  )
}
