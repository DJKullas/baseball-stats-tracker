"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Share2, Copy, Check } from "lucide-react"

export default function ShareButton({ teamId }: { teamId: string }) {
  const [hasCopied, setHasCopied] = useState(false)
  const publicUrl = `${window.location.origin}/public/team/${teamId}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl)
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Team Stats</DialogTitle>
          <DialogDescription>Anyone with this link will be able to view your team's stats.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input id="link" defaultValue={publicUrl} readOnly />
          </div>
          <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
            <span className="sr-only">Copy</span>
            {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
