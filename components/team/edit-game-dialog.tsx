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
        R: (r.stats as any)?.R || 0,
        H: (r.stats as any)?.H || 0,
        RBI: (r.stats as any)?.RBI || 0,
        BB: (r.stats as any)?.BB || 0,
        SO: (r.stats as any)?.SO || 0,
        HBP: (r.stats as any)?.HBP || 0,
        SF: (r.stats as any)?.SF || 0,
        "1B": (r.stats as any)?.["1B"] || 0,
        "2B": (r.stats as any)?.["2B"] || 0,
        "3B": (r.stats as any)?.["3B"] || 0,
        HR: (r.stats as any)?.HR || 0,
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogDescription>
            Editing game from {new Date(game.game_date + "T00:00:00").toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name={`playerStats.${index}.playerId`}
                      render={({ field }) => (
                        <FormItem className="flex-grow max-w-[200px]">
                          <FormLabel>Player</FormLabel>
                          <FormControl>
                            <PlayerCombobox players={players} value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Basic Stats Row */}
                  <div className="grid grid-cols-4 gap-2">
                    <FormField
                      name={`playerStats.${index}.PA`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PA</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
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
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`playerStats.${index}.R`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>R</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
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
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hit Types Row */}
                  <div className="grid grid-cols-4 gap-2">
                    <FormField
                      name={`playerStats.${index}.1B`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>1B</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`playerStats.${index}.2B`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>2B</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`playerStats.${index}.3B`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>3B</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`playerStats.${index}.HR`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HR</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Other Stats Row */}
                  <div className="grid grid-cols-5 gap-2">
                    <FormField
                      name={`playerStats.${index}.RBI`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RBI</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
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
                            <Input type="number" {...field} className="w-full" />
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
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`playerStats.${index}.HBP`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HBP</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`playerStats.${index}.SF`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SF</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-full" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    playerId: "",
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
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Player to Game
              </Button>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
