import { type NextRequest, NextResponse } from "next/server"
import { twiml } from "twilio"
import twilio from "twilio"
import { createClient } from "@supabase/supabase-js"
import { processScorebookImage } from "@/lib/ai-processing"
import twilioClient from "@/lib/twilio"
import { normalizePhoneNumber } from "@/lib/utils"
import type { Database } from "@/lib/database.types"

async function sendSmsResponse(to: string, body: string) {
  const from = process.env.TWILIO_PHONE_NUMBER
  try {
    await twilioClient.messages.create({ body, from, to })
  } catch (error) {
    console.error("Failed to send SMS response:", error)
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const twilioSignature = req.headers.get("X-Twilio-Signature")
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const url = req.url
  const bodyText = await req.text()
  const params = new URLSearchParams(bodyText)
  const postParams = Object.fromEntries(params.entries())

  if (!authToken || !twilioSignature || !twilio.validateRequest(authToken, twilioSignature, url, postParams)) {
    return new NextResponse("Invalid Twilio signature", { status: 403 })
  }

  const messageBody = params.get("Body") || ""
  const fromNumber = params.get("From") || ""
  const mediaUrl = params.get("MediaUrl0") || null
  const smsCode = messageBody.split(" ")[0]

  if (!smsCode) {
    await sendSmsResponse(fromNumber, "Error: No team code provided. Please send your code followed by the image.")
    return new NextResponse(new twiml.MessagingResponse().toString(), { status: 400 })
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, whitelisted_phone_numbers")
    .eq("sms_code", smsCode)
    .single()

  if (teamError || !team) {
    await sendSmsResponse(fromNumber, "Error: Invalid team code. Please check your code and try again.")
    return new NextResponse(new twiml.MessagingResponse().toString(), { status: 404 })
  }

  const normalizedFromNumber = normalizePhoneNumber(fromNumber)
  const isWhitelisted = team.whitelisted_phone_numbers?.map(normalizePhoneNumber).includes(normalizedFromNumber)

  if (!isWhitelisted) {
    await sendSmsResponse(
      fromNumber,
      `Error: Your number (${fromNumber}) is not authorized to submit stats for ${team.name}.`,
    )
    return new NextResponse(new twiml.MessagingResponse().toString(), { status: 403 })
  }

  if (!mediaUrl) {
    await sendSmsResponse(fromNumber, "Error: No image found. Please attach a picture of your scorebook.")
    return new NextResponse(new twiml.MessagingResponse().toString(), { status: 400 })
  }

  await sendSmsResponse(fromNumber, `Thanks! We've received the scorebook for ${team.name} and are processing it now.`)

  try {
    const processedStats = await processScorebookImage(mediaUrl)
    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("team_id", team.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (seasonError || !season) throw new Error("Could not find a season for this team.")

    // Create a new, unique game for this submission
    const { data: newGame, error: newGameError } = await supabase
      .from("games")
      .insert({ team_id: team.id, season_id: season.id, game_date: new Date().toISOString().split("T")[0] })
      .select("id")
      .single()

    if (newGameError) {
      console.error("Supabase error creating game:", newGameError.message)
      throw new Error("Failed to create a new game entry.")
    }
    const gameId = newGame.id

    for (const playerData of processedStats) {
      const playerName = playerData.playerName.trim()
      if (!playerName) continue

      let { data: player } = await supabase
        .from("players")
        .select("id")
        .eq("team_id", team.id)
        .ilike("name", playerName)
        .single()

      if (!player) {
        const { data: newPlayer, error: newPlayerError } = await supabase
          .from("players")
          .insert({ team_id: team.id, name: playerName })
          .select("id")
          .single()
        if (newPlayerError) throw new Error(`Failed to create player ${playerName}: ${newPlayerError.message}`)
        player = newPlayer
      }

      const { error: resultError } = await supabase
        .from("results")
        .insert({ player_id: player.id, game_id: gameId, stats: playerData.stats })
      if (resultError) throw new Error(`Failed to create result for player ${playerName}: ${resultError.message}`)
    }

    await sendSmsResponse(
      fromNumber,
      `Successfully processed stats for ${processedStats.length} players for ${team.name}!`,
    )
  } catch (error) {
    console.error("Error processing stats:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    await sendSmsResponse(fromNumber, `Sorry, we ran into an issue processing your scorebook: ${errorMessage}`)
  }

  return new NextResponse(new twiml.MessagingResponse().toString(), { headers: { "Content-Type": "text/xml" } })
}
