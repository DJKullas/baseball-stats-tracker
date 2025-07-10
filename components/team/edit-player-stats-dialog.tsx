"use client"

import type { Player, ResultWithRelations } from "@/lib/types"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { updatePlayerStats } from "@/app/(app)/team/[teamId]/actions"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

const statSchema = z.object({
  resultId: z.string(),
  gameDate: z.string(),
  seasonName: z.string(),
  stats: z.object({
    PA: z.coerce.number().int().min(0).default(0),
    AB: z.coerce.number().int().min(0).default(0),
    R: z.coerce.number().int().min(0).default(0),
    H: z.coerce.number().int().min(0).default(0),
    "1B": z.coerce.number().int().min(0).default(0),
    "2B": z.coerce.number().int().min(0).default(0),
    "3B": z.coerce.number().int().min(0).default(0),
    HR: z.coerce.number().int().min(0).default(0),
    RBI: z.coerce.number().int().min(0).default(0),
    BB: z.coerce.number().int().min(0).default(0),
    SO: z.coerce.number().int().min(0).default(0),
    HBP: z.coerce.number().int().min(0).default(0),
    SF: z.coerce.number().int().min(0).default(0),
    SAC: z.coerce.number().int().min(0).default(0),
  }),
})

const formSchema = z.object({
  playerGameStats: z.array(statSchema),
})

type EditPlayerStatsDialogProps = {
  teamId: string
  player: Player
  playerResults: ResultWithRelations[]
  isOpen: boolean
  onClose: () => void
  onStatsUpdated: () => void
}

export default function EditPlayerStatsDialog({
  teamId,
  player,
  playerResults,
  isOpen,
  onClose,
  onStatsUpdated,
}: EditPlayerStatsDialogProps) {
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerGameStats: playerResults
        .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
        .map((r) => ({
          resultId: r.id,
          gameDate: new Date(r.game_date).toLocaleDateString(),
          seasonName: r.seasons?.name || "Unassigned",
          stats: {
            PA: (r.stats as any)?.PA || 0,
            AB: (r.stats as any)?.AB || 0,
            R: (r.stats as any)?.R || 0,
            H: (r.stats as any)?.H || 0,
            "1B": (r.stats as any)?.["1B"] || 0,
            "2B": (r.stats as any)?.["2B"] || 0,
            "3B": (r.stats as any)?.["3B"] || 0,
            HR: (r.stats as any)?.HR || 0,
            RBI: (r.stats as any)?.RBI || 0,
            BB: (r.stats as any)?.BB || 0,
            SO: (r.stats as any)?.SO || 0,
            HBP: (r.stats as any)?.HBP || 0,
            SF: (r.stats as any)?.SF || 0,
            SAC: (r.stats as any)?.SAC || 0,
          },
        })),
    },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: "playerGameStats",
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    const statsToUpdate = values.playerGameStats.map((gameStat) => ({
      resultId: gameStat.resultId,
      stats: gameStat.stats,
    }))

    const result = await updatePlayerStats(teamId, statsToUpdate)

    if (result.success) {
      toast.success(`${player.name}'s stats have been updated.`)
      onStatsUpdated()
      onClose()
    } else {
      toast.error("Failed to update stats.", { description: result.error })
    }
    setIsPending(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Stats for {player.name}</DialogTitle>
          <DialogDescription>
            Adjust individual game statistics. Changes will be reflected across the app.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">
                      Game on {field.gameDate} <span className="text-muted-foreground">({field.seasonName})</span>
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-4">
                      {Object.keys(field.stats).map((statKey) => (
                        <FormField
                          key={statKey}
                          control={form.control}
                          name={`playerGameStats.${index}.stats.${statKey as keyof typeof field.stats}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">{statKey.toUpperCase()}</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} className="w-full h-8" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
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
