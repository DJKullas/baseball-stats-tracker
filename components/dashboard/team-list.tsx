"use client"

import type { Team } from "@/lib/types"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import NewTeamDialog from "./new-team-dialog"

type TeamWithPlayerCount = Team & {
  players: { count: number }[]
}

export default function TeamList({ initialTeams }: { initialTeams: TeamWithPlayerCount[] }) {
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null)

  const copyToClipboard = (smsCode: string, teamId: string) => {
    navigator.clipboard.writeText(smsCode)
    setCopiedTeamId(teamId)
    toast.success("SMS code copied to clipboard!")
    setTimeout(() => setCopiedTeamId(null), 2000)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Teams</CardTitle>
          <CardDescription>Select a team to view detailed stats and manage players.</CardDescription>
        </div>
        <NewTeamDialog />
      </CardHeader>
      <CardContent className="grid gap-4">
        {initialTeams.length > 0 ? (
          initialTeams.map((team) => (
            <div key={team.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{team.name}</p>
                  <Badge variant="outline" className="font-mono text-xs">
                    {team.sms_code}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(team.sms_code, team.id)}
                  >
                    <span className="sr-only">Copy SMS code</span>
                    {copiedTeamId === team.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{team.players[0]?.count || 0} Players</p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/team/${team.id}`}>
                  View Team <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 text-center p-8 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-bold tracking-tight">You have no teams yet.</h3>
            <p className="text-sm text-muted-foreground">Get started by creating your first team.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
