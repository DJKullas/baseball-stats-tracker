"use client"

import { useEffect } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"

import type { Player } from "@/lib/types"
import { addGameResults } from "@/app/(app)/team/[teamId]/actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PlayerCombobox } from "./player-combobox"
import type { GameWithRelations } from "@/lib/types"

const statSchema = z.object({
  playerId: z.string().min(1, "Player is required."),
  PA: z.coerce.number().int().min(0).default(0),
  AB: z.coerce.number().int().min(0).default(0),
  R: z.coerce.number().int().min(0).default(0),
  H: z.coerce.number().int().min(0).default(0),
  RBI: z.coerce.number().int().min(0).default(0),
  BB: z.coerce.number().int().min(0).default(0),
  SO: z.coerce.number().int().min(0).default(0),
})

const formSchema = z.object({
  playerStats: z.array(statSchema),
})

interface ManualEntryFormProps {
  teamId: string
  seasonId?: string
  gameDate: Date
  onGameAdded: (newGame: GameWithRelations, newPlayers: Player[]) => void
  players: Player[]
}

export function ManualEntryForm({ teamId, seasonId, gameDate, onGameAdded, players }: ManualEntryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerStats: [],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "playerStats",
  })

  useEffect(() => {
    replace([])
  }, [players, replace])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!seasonId) {
      toast.error("A season must be selected to save a game.")
      return
    }

    const result = await addGameResults(teamId, {
      seasonId: seasonId,
      gameDate: gameDate,
      playerStats: values.playerStats,
    })

    if (result.success && result.data) {
      toast.success("Game saved successfully!")
      onGameAdded(result.data.newGame, result.data.newPlayers) // Pass new players
      form.reset({ playerStats: [] })
    } else {
      toast.error("Failed to save game.", { description: result.error })
    }
  }

  const isSubmitting = form.formState.isSubmitting
  const hasNoSeason = !seasonId

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-6">
        {hasNoSeason && (
          <div className="rounded-md border border-dashed border-yellow-500 bg-yellow-50 p-4 text-center text-sm text-yellow-700">
            Please select a season above to enable manual entry.
          </div>
        )}
        <fieldset disabled={isSubmitting || hasNoSeason} className="space-y-4">
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
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
                name={`playerStats.${index}.R`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>R</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="w-16" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
            onClick={() => append({ playerId: "", PA: 0, AB: 0, R: 0, H: 0, RBI: 0, BB: 0, SO: 0 })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Player Stats
          </Button>
        </fieldset>
        <Button type="submit" disabled={isSubmitting || hasNoSeason || fields.length === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Manually
        </Button>
      </form>
    </Form>
  )
}
