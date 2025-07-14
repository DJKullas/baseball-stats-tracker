"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, XIcon, Loader2, Phone, MessageSquare } from "lucide-react"
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
    <div className="space-y-6">
      {/* SMS Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Scorebook Upload
          </CardTitle>
          <CardDescription>Send scorebook photos via SMS to automatically extract statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twilioPhoneNumber && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Send photos to:</span>
              <Badge variant="outline" className="font-mono">
                {twilioPhoneNumber}
              </Badge>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Your team code:</span>
            <Badge variant="secondary" className="font-mono">
              {smsCode}
            </Badge>
            <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-6 w-6 p-0">
              {hasCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>To upload a scorebook:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Take a photo of your scorebook</li>
              <li>Text the photo to {twilioPhoneNumber || "the SMS number"}</li>
              <li>Include your team code "{smsCode}" in the message</li>
              <li>Statistics will be automatically extracted and added to your team</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Whitelist Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Number Whitelist</CardTitle>
          <CardDescription>Configure which phone numbers can submit stats via SMS for your team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
    </div>
  )
}
