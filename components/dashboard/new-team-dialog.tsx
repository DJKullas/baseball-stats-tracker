"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { createTeam } from "@/app/(app)/actions"
import { Loader2, PlusCircle } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
})

export default function NewTeamDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true)
    const result = await createTeam(values.name)
    if (result.success && result.data) {
      toast.success(`Team "${result.data.name}" created successfully.`)
      setIsOpen(false)
      form.reset()
      router.refresh() // Refresh the page to show the new team
    } else {
      toast.error("Failed to create team", { description: result.error })
    }
    setIsPending(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
              <DialogDescription>Enter a name for your new team.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Champions" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export { default as NewTeamDialog } from "./new-team-dialog"
