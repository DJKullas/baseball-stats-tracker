"use client"

import { useState } from "react"
import type { Player } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pencil, Check, X, Users } from "lucide-react"
import { updatePlayerName, mergePlayers } from "@/app/(app)/team/[teamId]/actions"
import { toast } from "sonner"

interface PlayerTableProps {
  players: Player[]
  teamId: string
}

export default function PlayerTable({ players, teamId }: PlayerTableProps) {
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [sourcePlayerId, setSourcePlayerId] = useState<string>("")
  const [targetPlayerId, setTargetPlayerId] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleEditStart = (player: Player) => {
    setEditingPlayer(player.id)
    setEditName(player.name)
  }

  const handleEditCancel = () => {
    setEditingPlayer(null)
    setEditName("")
  }

  const handleEditSave = async (playerId: string) => {
    if (!editName.trim()) {
      toast.error("Player name cannot be empty")
      return
    }

    if (isUpdating) return

    setIsUpdating(true)

    try {
      console.log("=== FRONTEND DEBUG ===")
      console.log("Player ID being sent:", playerId)
      console.log("Player ID type:", typeof playerId)
      console.log("Team ID being sent:", teamId)
      console.log("New name:", editName.trim())

      // Find the player in our local data
      const localPlayer = players.find((p) => p.id === playerId)
      console.log("Local player data:", localPlayer)

      const result = await updatePlayerName(teamId, playerId, editName.trim())
      console.log("updatePlayerName result:", result)

      if (result.success) {
        toast.success("Player name updated successfully")
        setEditingPlayer(null)
        setEditName("")
      } else {
        toast.error(result.error || "Failed to update player name")
        console.error("Update failed:", result.error)
      }
    } catch (error) {
      console.error("Error in handleEditSave:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMergeStart = (playerId: string) => {
    setSourcePlayerId(playerId)
    setTargetPlayerId("")
    setMergeDialogOpen(true)
  }

  const handleMergeCancel = () => {
    setMergeDialogOpen(false)
    setSourcePlayerId("")
    setTargetPlayerId("")
  }

  const handleMergeConfirm = async () => {
    if (!sourcePlayerId || !targetPlayerId) {
      toast.error("Please select both players")
      return
    }

    if (sourcePlayerId === targetPlayerId) {
      toast.error("Cannot merge a player with themselves")
      return
    }

    const sourcePlayer = players.find((p) => p.id === sourcePlayerId)
    const targetPlayer = players.find((p) => p.id === targetPlayerId)

    const result = await mergePlayers(teamId, sourcePlayerId, targetPlayerId)

    if (result.success) {
      toast.success(`Successfully merged ${sourcePlayer?.name} into ${targetPlayer?.name}`)
      setMergeDialogOpen(false)
      setSourcePlayerId("")
      setTargetPlayerId("")
    } else {
      toast.error(result.error || "Failed to merge players")
    }
  }

  const sourcePlayer = players.find((p) => p.id === sourcePlayerId)
  const availableTargets = players.filter((p) => p.id !== sourcePlayerId)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player Name</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length > 0 ? (
                players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      {editingPlayer === player.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditSave(player.id)
                            } else if (e.key === "Escape") {
                              handleEditCancel()
                            }
                          }}
                          className="h-8"
                          autoFocus
                          disabled={isUpdating}
                        />
                      ) : (
                        player.name
                      )}
                    </TableCell>
                    <TableCell>{new Date(player.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {editingPlayer === player.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSave(player.id)}
                            className="h-8 w-8 p-0"
                            disabled={isUpdating}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleEditCancel}
                            className="h-8 w-8 p-0"
                            disabled={isUpdating}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStart(player)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMergeStart(player.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No players on this team yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Players</DialogTitle>
            <DialogDescription>
              Move all stats from "{sourcePlayer?.name}" to another player. The source player will be deleted after the
              merge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">From (will be deleted):</label>
              <div className="mt-1 p-2 bg-muted rounded text-sm">{sourcePlayer?.name}</div>
            </div>

            <div>
              <label className="text-sm font-medium">To (will receive all stats):</label>
              <Select value={targetPlayerId} onValueChange={setTargetPlayerId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select target player" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleMergeCancel}>
              Cancel
            </Button>
            <Button onClick={handleMergeConfirm} disabled={!targetPlayerId}>
              Merge Players
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
