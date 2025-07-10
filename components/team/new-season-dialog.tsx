"use client"

import type { Season } from "@/lib/types"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { addSeason } from "@/app/(app)/team/[teamId]/actions"
import { Loader2 } from "lucide-react"
import { PlusCircle } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Season name must be at least 2 characters.",
  }),
})

type NewSeasonDialogProps = {
  teamId: string
  onSeasonAdded: (season: Season) => void
  asTrigger?: boolean
}

export default function NewSeasonDialog({ teamId, onSeasonAdded, asTrigger = false }: NewSeasonDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    const result = await addSeason(teamId, values.name)
    if (result.success && result.data) {
      onSeasonAdded(result.data)
      setIsOpen(false)
      form.reset()
    } else {
      // TODO: Show error toast
      console.error(result.error)
    }
    setIsPending(false)
  }

  const Trigger = asTrigger ? (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <PlusCircle className="mr-2 h-4 w-4" />
      New Season
    </DropdownMenuItem>
  ) : (
    <Button variant="outline">New Season</Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{Trigger}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create a New Season</DialogTitle>
              <DialogDescription>Start a new season to keep stats separate from previous ones.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2026 Spring Season" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Season
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
