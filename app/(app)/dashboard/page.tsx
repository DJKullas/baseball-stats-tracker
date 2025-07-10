import { createClient } from "@/lib/supabase/server"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Users, Trophy, BarChart3 } from "lucide-react"
import { getAuthStatus } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import TeamList from "@/components/dashboard/team-list"
import GettingStarted from "@/components/dashboard/getting-started"
import SubscriptionGate from "@/components/dashboard/subscription-gate"
import { verifyStripeSessionAndOnboard } from "../actions"

type AggregatedStats = {
  [key: string]: any
  PA: number
  AB: number
  H: number
  BB: number
  HBP: number
  SF: number
  "1B": number
  "2B": number
  "3B": number
  HR: number
}

const wobaWeights = { wBB: 0.69, wHBP: 0.72, w1B: 0.89, w2B: 1.27, w3B: 1.62, wHR: 2.1 }

const formatStat = (num: number) => (num === 0 ? ".000" : num.toFixed(3).toString())

export default async function Dashboard({ searchParams }: { searchParams: { session_id?: string } }) {
  // If the user is returning from a Stripe checkout, verify the session and redirect.
  if (searchParams.session_id) {
    const result = await verifyStripeSessionAndOnboard(searchParams.session_id)

    // After verification, redirect to the clean dashboard URL.
    // This forces a new request and ensures the page reloads with the fresh auth status.
    if (result.error) {
      // If there was an error, we can redirect to billing with a message.
      // This is a good practice but for now, we'll just go to the dashboard.
      console.error("Stripe verification error:", result.error)
    }
    return redirect("/dashboard")
  }

  // The rest of the component logic remains the same.
  // It will now run on the second, clean request.
  const { isLoggedIn, isSubscribed, isOnboarded, user } = await getAuthStatus()

  if (!isLoggedIn) {
    redirect("/login")
  }

  // If they are still not onboarded (e.g., they abandoned checkout), redirect them.
  if (!isOnboarded) {
    redirect("/onboarding")
  }

  // If they are onboarded but not subscribed, show the paywall.
  if (!isSubscribed) {
    return <SubscriptionGate />
  }

  // If we reach here, user is logged in, onboarded, and subscribed.
  const supabase = createClient()

  const { data: teamsData, count: teamCount } = await supabase
    .from("teams")
    .select("id, name, players(count)", { count: "exact" })
    .eq("user_id", user!.id)

  const { count: playerCount } = await supabase
    .from("players")
    .select("id", { count: "exact" })
    .in("team_id", teamsData?.map((t) => t.id) || [])

  const { count: gameCount } = await supabase
    .from("games")
    .select("id", { count: "exact", head: true })
    .in("team_id", teamsData?.map((t) => t.id) || [])

  // Fetch all results for the user's teams to calculate league leaders
  const { data: allResults } = await supabase
    .from("results")
    .select(`*, players(id, name, teams(name))`)
    .in(
      "player_id",
      (
        await supabase
          .from("players")
          .select("id")
          .in("team_id", teamsData?.map((t) => t.id) || [])
      ).data?.map((p) => p.id) || [],
    )

  const playerAggregates: Record<string, AggregatedStats & { name: string; teamName: string }> = {}

  allResults?.forEach((res) => {
    if (!res.players) return
    const playerId = res.players.id
    if (!playerAggregates[playerId]) {
      playerAggregates[playerId] = {
        name: res.players.name,
        teamName: res.players.teams?.name || "",
        PA: 0,
        AB: 0,
        H: 0,
        BB: 0,
        HBP: 0,
        SF: 0,
        "1B": 0,
        "2B": 0,
        "3B": 0,
        HR: 0,
      }
    }
    const stats = res.stats as Partial<AggregatedStats>
    for (const key in stats) {
      if (key in playerAggregates[playerId] && typeof stats[key as keyof AggregatedStats] === "number") {
        playerAggregates[playerId][key as keyof AggregatedStats] += stats[key as keyof AggregatedStats] || 0
      }
    }
  })

  const leagueLeaders = Object.values(playerAggregates)
    .map((p) => {
      const wobaNumerator =
        wobaWeights.wBB * p.BB +
        wobaWeights.wHBP * p.HBP +
        wobaWeights.w1B * p["1B"] +
        wobaWeights.w2B * p["2B"] +
        wobaWeights.w3B * p["3B"] +
        wobaWeights.wHR * p.HR
      const wobaDenominator = p.AB + p.BB + p.SF + p.HBP
      const woba = wobaDenominator > 0 ? wobaNumerator / wobaDenominator : 0
      return { ...p, woba }
    })
    .sort((a, b) => b.woba - a.woba)
    .slice(0, 3)

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {profile?.full_name || user?.email}!
        </h1>
        <p className="text-muted-foreground">Here's a high-level overview of your organization.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playerCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Recorded</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TeamList initialTeams={teamsData || []} />
        <GettingStarted twilioPhoneNumber={process.env.TWILIO_PHONE_NUMBER} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>League Leaders (by wOBA)</CardTitle>
          <CardDescription>Top performing players across all your teams.</CardDescription>
        </CardHeader>
        <CardContent>
          {leagueLeaders && leagueLeaders.length > 0 ? (
            <div className="space-y-4">
              {leagueLeaders.map((player, index) => (
                <div key={player.name} className="flex items-center">
                  <Trophy
                    className={`h-5 w-5 mr-4 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-yellow-700"}`}
                  />
                  <div className="grid gap-1 flex-1">
                    <p className="text-sm font-medium leading-none">{player.name}</p>
                    <p className="text-sm text-muted-foreground">{player.teamName}</p>
                  </div>
                  <div className="font-mono font-bold text-lg">{formatStat(player.woba)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8">No stats recorded yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
