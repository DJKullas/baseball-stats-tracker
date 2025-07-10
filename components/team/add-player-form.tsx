"use client"

import type { Player } from "@/lib/types"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { addPlayer } from "@/app/(app)/team/[teamId]/actions"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Player name must be at least 2 characters.",
  }),
})

type AddPlayerFormProps = {
  teamId: string
  onPlayerAdded: (player: Player) => void
}

export default function AddPlayerForm({ teamId, onPlayerAdded }: AddPlayerFormProps) {
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    const result = await addPlayer(teamId, values.name)
    if (result.success && result.data) {
      toast.success(`${result.data.name} has been added to the roster.`)
      onPlayerAdded(result.data)
    } else {
      toast.error("Failed to add player", { description: result.error })
    }
    setIsPending(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Player
        </Button>
      </form>
    </Form>
  )
}
