"use client"

import type React from "react"

import { useState, useRef } from "react"
import { upload } from "@vercel/blob/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import type { Player, Season } from "@/lib/types"
import type { GameWithRelations } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { processImageUrlAndCreateGame } from "@/app/(app)/team/[teamId]/actions"
import { ManualEntryForm } from "./manual-entry-form"

interface ManualEntryProps {
  teamId: string
  players: Player[]
  seasons: Season[]
  onGameAdded: (newGame: GameWithRelations, newPlayers: Player[]) => void
}

export function ManualEntry({ teamId, players, seasons, onGameAdded }: ManualEntryProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(
    seasons.length > 0 ? seasons[0].id : undefined,
  )
  const [gameDate, setGameDate] = useState<Date>(new Date())
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(Date.now())

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value
    if (dateString) {
      // This creates a date object at midnight in the user's local timezone
      const localDate = new Date(dateString + "T00:00:00")
      setGameDate(localDate)
    }
  }

  const handleImageUpload = async () => {
    if (!inputFileRef.current?.files?.[0]) {
      toast.error("Please select an image file first.")
      return
    }
    if (!selectedSeasonId) {
      toast.error("Please select a season first.")
      return
    }

    setIsUploading(true)
    const file = inputFileRef.current.files[0]

    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob",
      })

      toast.promise(processImageUrlAndCreateGame(teamId, selectedSeasonId, gameDate, newBlob.url), {
        loading: "AI is processing the scorebook...",
        success: (result) => {
          if (result.success && result.data) {
            onGameAdded(result.data.newGame, result.data.newPlayers) // Pass new players
            const gameDate = new Date(result.data.newGame.game_date + "T00:00:00")
            return `Game on ${gameDate.toLocaleDateString()} created successfully!`
          }
          throw new Error(result.error || "An unknown error occurred.")
        },
        error: (err: Error) => `Failed to process image: ${err.message}`,
      })
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
      setFileInputKey(Date.now())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Game Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="season">Season</Label>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId} disabled={seasons.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="game-date">Game Date</Label>
            <Input
              id="game-date"
              type="date"
              value={gameDate.toISOString().split("T")[0]}
              onChange={handleDateChange}
            />
          </div>
        </div>

        <Tabs defaultValue="manual" className="mt-4">
          <TabsList>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload Image</TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <ManualEntryForm
              teamId={teamId}
              seasonId={selectedSeasonId}
              gameDate={gameDate}
              onGameAdded={onGameAdded}
              players={players}
            />
          </TabsContent>
          <TabsContent value="upload">
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a picture of your scorebook. The AI will process it and automatically create the game and stats.
              </p>
              <div className="space-y-2">
                <Label htmlFor="scorebook-image">Scorebook Image</Label>
                <Input id="scorebook-image" ref={inputFileRef} type="file" accept="image/*" key={fileInputKey} />
              </div>
              <Button onClick={handleImageUpload} disabled={isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? "Processing..." : "Upload and Process Image"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ManualEntry
