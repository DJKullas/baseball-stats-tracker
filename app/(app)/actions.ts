"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

/* ------------------------------------------------------------------ */
/*  LOGOUT                                                             */
/* ------------------------------------------------------------------ */

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect("/")
}

/* ------------------------------------------------------------------ */
/*  VERIFY STRIPE SESSION & ONBOARD                                    */
/* ------------------------------------------------------------------ */

export async function verifyStripeSessionAndOnboard(sessionId: string) {
  if (!sessionId.startsWith("cs_")) {
    return { error: "Invalid Stripe session ID." }
  }

  try {
    const supabase = createClient()

    // Retrieve the Checkout Session (includes the subscription object)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })

    const subscription = session.subscription as import("stripe").Stripe.Subscription | null

    // The metadata is on the subscription, not the session itself.
    const userId = subscription?.metadata?.userId

    if (!userId || !subscription) {
      return { error: "Missing data from Stripe session." }
    }

    // Avoid double-processing
    const { data: existing } = await supabase.from("profiles").select("has_onboarded").eq("id", userId).single()

    if (existing?.has_onboarded) return { success: true }

    // Update the profile with Stripe info and mark onboarding complete
    const { error } = await supabase
      .from("profiles")
      .update({
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0].price.id,
        stripe_subscription_status: subscription.status,
        has_onboarded: true,
      })
      .eq("id", userId)

    if (error) throw error

    // Refresh any cached dashboard/onboarding routes
    revalidatePath("/dashboard")
    revalidatePath("/onboarding")

    return { success: true }
  } catch (err) {
    console.error("verifyStripeSessionAndOnboard error:", err)
    return { error: "Unable to verify payment. Please contact support." }
  }
}

/* ------------------------------------------------------------------ */
/*  CREATE TEAM                                                        */
/* ------------------------------------------------------------------ */

export async function createTeam(teamName: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      user_id: user.id,
      name: teamName,
      sms_code: `${teamName.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`,
    })
    .select("id, name")
    .single()

  if (error) {
    console.error("createTeam error:", error)
    return { error: "Could not create team." }
  }

  // Create a default season
  await supabase.from("seasons").insert({
    team_id: team.id,
    name: "2025 Season",
  })

  revalidatePath("/dashboard")
  return { data: team }
}
