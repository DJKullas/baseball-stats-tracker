"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export interface Team {
  id: string
  name: string
}

interface TeamListProps {
  teams: Team[]
}

/**
 * Displays a grid of teams linking to their dashboard pages.
 */
export default function TeamList({ teams }: TeamListProps) {
  if (!teams?.length) {
    return <p className="text-muted-foreground">No teams yet&nbsp;— create one!</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <Link key={team.id} href={`/app/team/${team.id}`}>
          <Card className="hover:ring-2 hover:ring-primary transition">
            <CardHeader>
              <CardTitle className="truncate">{team.name}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
