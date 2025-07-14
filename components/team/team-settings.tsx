"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Phone, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface TeamSettingsProps {
  team: {
    id: string
    name: string
    sms_code: string
    is_public: boolean
  }
  twilioPhoneNumber?: string
  onUpdateTeam: (updates: { name?: string; is_public?: boolean }) => void
}

export function TeamSettings({ team, twilioPhoneNumber, onUpdateTeam }: TeamSettingsProps) {
  const [teamName, setTeamName] = useState(team.name)
  const [isPublic, setIsPublic] = useState(team.is_public)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    onUpdateTeam({ name: teamName, is_public: isPublic })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "SMS code copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
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
              {team.sms_code}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(team.sms_code)} className="h-6 w-6 p-0">
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>To upload a scorebook:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Take a photo of your scorebook</li>
              <li>Text the photo to {twilioPhoneNumber || "the SMS number"}</li>
              <li>
                Include your team code "<span className="font-mono">{team.sms_code}</span>" in the message
              </li>
              <li>Statistics will be extracted and added to your team</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Team Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Settings</CardTitle>
          <CardDescription>Manage your team&#39;s basic information and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle">Public Team</Label>
              <p className="text-sm text-muted-foreground">Allow others to view your team&#39;s statistics</p>
            </div>
            <Switch id="public-toggle" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default TeamSettings
