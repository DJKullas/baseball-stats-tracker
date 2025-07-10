import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OnboardingForm from "./onboarding-form"

export default async function OnboardingPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("has_onboarded").eq("id", user.id).single()

  if (profile?.has_onboarded) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome to ScorebookSnap!</h1>
        <p className="text-muted-foreground text-center mb-8">Let's get your team set up.</p>
        <OnboardingForm />
      </div>
    </div>
  )
}
