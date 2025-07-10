"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const proPriceId = process.env.STRIPE_PRO_PRICE_ID!
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

export async function createCheckoutSession() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer: profile?.stripe_customer_id || undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    line_items: [{ price: proPriceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        userId: user.id,
      },
    },
    success_url: `${siteUrl}/dashboard`,
    cancel_url: `${siteUrl}/billing`,
  })

  if (session.url) {
    redirect(session.url)
  }
}

export async function createPortalSession() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single()

  if (!profile?.stripe_customer_id) {
    throw new Error("Stripe customer ID not found for user.")
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/billing`,
  })

  if (portalSession.url) {
    redirect(portalSession.url)
  }
}
