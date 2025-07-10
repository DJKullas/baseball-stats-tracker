import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export type AuthStatus = {
  isLoggedIn: boolean
  isSubscribed: boolean
  isOnboarded: boolean
  user: User | null
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isLoggedIn: false, isSubscribed: false, isOnboarded: false, user: null }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_onboarded, stripe_subscription_status")
    .eq("id", user.id)
    .single()

  // If no profile, they are not onboarded or subscribed
  if (!profile) {
    return { isLoggedIn: true, isSubscribed: false, isOnboarded: false, user }
  }

  const isOnboarded = profile.has_onboarded || false
  const isSubscribed =
    profile.stripe_subscription_status === "active" || profile.stripe_subscription_status === "trialing"

  return { isLoggedIn: true, isSubscribed, isOnboarded, user }
}

// This function can be used on pages that absolutely require a subscription
export async function protectPage() {
  const { isLoggedIn, isSubscribed, isOnboarded } = await getAuthStatus()

  if (!isLoggedIn) {
    return redirect("/login")
  }

  if (!isOnboarded) {
    return redirect("/onboarding")
  }

  if (!isSubscribed) {
    // On the dashboard, we'll show a gate. For other pages, we might redirect.
    // For now, let's redirect from other protected pages.
    return redirect("/dashboard")
  }
}
