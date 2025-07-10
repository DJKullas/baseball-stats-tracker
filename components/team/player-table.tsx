import type { Player } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlayerTable({ players }: { players: Player[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Roster</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player Name</TableHead>
              <TableHead>Date Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.length > 0 ? (
              players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{new Date(player.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  No players on this team yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
