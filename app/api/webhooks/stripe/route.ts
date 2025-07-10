import { stripe } from "@/lib/stripe"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"

const supabaseAdmin = createSupabaseAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  let event: Stripe.Event

  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      // Retrieve the subscription details from the session
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      // Get the userId from the metadata we set during checkout creation
      const userId = subscription.metadata.userId

      if (!userId) {
        console.error("❌ Webhook Error: userId not found in subscription metadata.")
        break
      }

      // This is the crucial part: Update the user's profile with their new Stripe info
      // and mark them as onboarded, regardless of browser redirection.
      await supabaseAdmin
        .from("profiles")
        .update({
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
          has_onboarded: true, // This guarantees the account is set up.
        })
        .eq("id", userId)

      console.log(`✅ User ${userId} successfully onboarded and subscribed via webhook.`)
      break
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object
      // Update the subscription status in our database
      await supabaseAdmin
        .from("profiles")
        .update({
          stripe_subscription_status: subscription.status,
        })
        .eq("stripe_subscription_id", subscription.id)
      break
    }
    default:
    // console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
