"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, XIcon, Loader2 } from "lucide-react"
import { updateWhitelist } from "@/app/(app)/team/[teamId]/settings/actions"
import { toast } from "sonner"
import { normalizePhoneNumber } from "@/lib/utils"

type TeamSettingsProps = {
  teamId: string
  smsCode: string
  initialWhitelistedNumbers: string[] | null
  twilioPhoneNumber?: string
}

export default function TeamSettings({
  teamId,
  smsCode,
  initialWhitelistedNumbers,
  twilioPhoneNumber,
}: TeamSettingsProps) {
  const [hasCopied, setHasCopied] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(initialWhitelistedNumbers || [])
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState("")

  const copyToClipboard = () => {
    navigator.clipboard.writeText(smsCode)
    setHasCopied(true)
    toast.success("SMS code copied to clipboard!")
    setTimeout(() => setHasCopied(false), 2000)
  }

  const addPhoneNumber = () => {
    if (!currentPhoneNumber) return
    const normalized = normalizePhoneNumber(currentPhoneNumber)
    if (phoneNumbers.includes(normalized)) {
      toast.info("This phone number has already been added.")
    } else {
      setPhoneNumbers([...phoneNumbers, normalized])
    }
    setCurrentPhoneNumber("")
  }

  const removePhoneNumber = (numberToRemove: string) => {
    setPhoneNumbers(phoneNumbers.filter((num) => num !== numberToRemove))
  }

  const handleSave = async () => {
    setIsPending(true)
    const result = await updateWhitelist(teamId, phoneNumbers)
    if (result.success) {
      toast.success("Whitelist updated successfully!")
    } else {
      toast.error("Failed to update whitelist", { description: result.error })
    }
    setIsPending(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS & Whitelist Settings</CardTitle>
        <CardDescription>
          Configure which phone numbers can submit stats via SMS and find your team's unique submission code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {twilioPhoneNumber && (
          <div className="space-y-2">
            <Label htmlFor="twilio-number">SMS Number</Label>
            <div className="flex items-center space-x-2">
              <Input id="twilio-number" value={twilioPhoneNumber} readOnly className="font-mono" />
            </div>
            <p className="text-sm text-muted-foreground">Send your scorebook images to this number.</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="sms-code">Your Team's SMS Code</Label>
          <div className="flex items-center space-x-2">
            <Input id="sms-code" value={smsCode} readOnly className="font-mono" />
            <Button type="button" size="sm" className="px-3" onClick={copyToClipboard}>
              <span className="sr-only">Copy</span>
              {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Include this code as the first word in your text message when submitting a scorebook image.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Whitelisted Phone Numbers</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., +15551234567"
              value={currentPhoneNumber}
              onChange={(e) => setCurrentPhoneNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addPhoneNumber()
                }
              }}
            />
            <Button type="button" onClick={addPhoneNumber}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {phoneNumbers.length > 0 ? (
              phoneNumbers.map((num) => (
                <Badge key={num} variant="secondary" className="flex items-center gap-1">
                  {num}
                  <button
                    type="button"
                    onClick={() => removePhoneNumber(num)}
                    className="ml-1 rounded-full hover:bg-muted"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No phone numbers whitelisted yet.</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
