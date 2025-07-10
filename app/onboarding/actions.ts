"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

// A helper to generate a unique, URL-friendly code for SMS submissions
function generateSmsCode(teamName: string): string {
  const slug = teamName
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric characters
  const randomChars = Math.random().toString(36).substring(2, 6) // Add random chars to ensure uniqueness
  return `${slug}-${randomChars}`
}

export async function completeOnboarding(data: { teamName: string; phoneNumbers: string[] }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This should ideally not happen if the page is protected, but it's a good safeguard.
    return { success: false, error: "User not authenticated" }
  }

  try {
    const { teamName, phoneNumbers } = data
    const smsCode = generateSmsCode(teamName)

    // Step 1: Insert the new team with whitelisted numbers and the SMS code.
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({
        user_id: user.id,
        name: teamName,
        whitelisted_phone_numbers: phoneNumbers,
        sms_code: smsCode,
      })
      .select("id")
      .single()

    if (teamError) {
      console.error("Error creating team:", teamError)
      return { success: false, error: "Could not create your team. The name might be taken." }
    }

    // Step 2: Create a default "2025 Season" for the new team.
    const { error: seasonError } = await supabase.from("seasons").insert({
      team_id: teamData.id,
      name: "2025 Season",
    })

    if (seasonError) {
      // Log this but don't fail the entire onboarding process.
      console.warn("Could not create default season:", seasonError)
    }

    // Step 3: Create the Stripe Checkout session for the free trial.
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!proPriceId || !siteUrl) {
      console.error("Stripe Price ID or Site URL is not configured in environment variables.")
      return { success: false, error: "Server configuration error. Please contact support." }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: user.email!,
      line_items: [{ price: proPriceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user.id, // Pass the user ID to the webhook
        },
      },
      success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/onboarding?onboarding_cancelled=true`,
    })

    if (!session.url) {
      return { success: false, error: "Could not create Stripe checkout session." }
    }

    // The user's profile will be marked as "onboarded" by the webhook after successful payment.
    // We return the URL to the client for redirection.
    return { success: true, data: { checkoutUrl: session.url } }
  } catch (error: unknown) {
    console.error("An unexpected error occurred during onboarding:", error)
    let errorMessage = "An unexpected error occurred. Please try again."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, error: errorMessage }
  }
}
