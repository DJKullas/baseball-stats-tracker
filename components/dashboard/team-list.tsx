"use client"

import type { Team } from "@/lib/types"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import NewTeamDialog from "./new-team-dialog"

type TeamWithPlayerCount = Team & {
  players: { count: number }[]
}

export default function TeamList({ initialTeams }: { initialTeams: TeamWithPlayerCount[] }) {
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
            <div key={team.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <div>
                <p className="font-semibold">{team.name}</p>
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
