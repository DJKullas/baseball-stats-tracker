"use client"

import type { Player, Season, GameWithRelations } from "@/lib/types"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PlayerCombobox } from "./player-combobox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { updateGameResults } from "@/app/(app)/team/[teamId]/actions"

const statSchema = z.object({
  resultId: z.string().optional(),
  playerId: z.string().min(1, { message: "Player is required." }),
  PA: z.coerce.number().int().min(0).default(0),
  AB: z.coerce.number().int().min(0).default(0),
  H: z.coerce.number().int().min(0).default(0),
  RBI: z.coerce.number().int().min(0).default(0),
  BB: z.coerce.number().int().min(0).default(0),
  SO: z.coerce.number().int().min(0).default(0),
})

const formSchema = z.object({
  playerStats: z.array(statSchema),
})

type EditGameDialogProps = {
  game: GameWithRelations
  teamId: string
  players: Player[]
  seasons: Season[]
  isOpen: boolean
  onClose: () => void
  onGameUpdated: (updatedGame: GameWithRelations, newPlayers: Player[]) => void
}

export default function EditGameDialog({ game, teamId, players, isOpen, onClose, onGameUpdated }: EditGameDialogProps) {
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerStats: game.results.map((r) => ({
        resultId: r.id,
        playerId: r.player_id,
        PA: (r.stats as any)?.PA || 0,
        AB: (r.stats as any)?.AB || 0,
        H: (r.stats as any)?.H || 0,
        RBI: (r.stats as any)?.RBI || 0,
        BB: (r.stats as any)?.BB || 0,
        SO: (r.stats as any)?.SO || 0,
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "playerStats",
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    const result = await updateGameResults(game.id, teamId, values.playerStats)
    if (result.success && result.data) {
      onGameUpdated(result.data.updatedGame, result.data.newPlayers)
      onClose()
    } else {
      console.error(result.error)
      // TODO: Show error toast
    }
    setIsPending(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogDescription>
            Editing game from {new Date(game.game_date + "T00:00:00").toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-h-[70vh] overflow-y-auto pr-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 flex-wrap border p-4 rounded-lg">
                  <FormField
                    control={form.control}
                    name={`playerStats.${index}.playerId`}
                    render={({ field }) => (
                      <FormItem className="flex-grow min-w-[150px]">
                        <FormLabel>Player</FormLabel>
                        <FormControl>
                          <PlayerCombobox players={players} value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Stat inputs */}
                  <FormField
                    name={`playerStats.${index}.PA`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PA</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-16" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name={`playerStats.${index}.AB`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AB</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-16" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name={`playerStats.${index}.H`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>H</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-16" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name={`playerStats.${index}.RBI`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RBI</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-16" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name={`playerStats.${index}.BB`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BB</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-16" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name={`playerStats.${index}.SO`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SO</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="w-16" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ playerId: "", PA: 0, AB: 0, H: 0, RBI: 0, BB: 0, SO: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Player to Game
              </Button>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
