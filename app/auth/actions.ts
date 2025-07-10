"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect("/login?message=Could not authenticate user")
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // First, sign up the new user
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // This is still good practice to have, even if email confirmation is off
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (signUpError) {
    console.error(signUpError)
    return redirect("/signup?message=Could not create user. Please try again.")
  }

  // Immediately sign in the user with the same credentials
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return redirect("/login?message=Could not log in after signup. Please try again.")
  }

  revalidatePath("/", "layout")
  // Redirect to the onboarding flow instead of showing a message
  redirect("/onboarding")
}

export async function socialLogin(provider: "google" | "facebook") {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return redirect("/login?message=Could not authenticate with provider")
  }

  if (data.url) {
    redirect(data.url)
  }
}
