import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Low-level helper that returns a configured server-side Supabase client.
 * Use this in Server Components, Route Handlers and Server Actions.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          /* noop – called from a Server Component */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch {
          /* noop – called from a Server Component */
        }
      },
    },
  })
}

/**
 * Alias kept for backwards compatibility with older imports.
 * Both names now resolve to the same function.
 */
export const createServerSupabaseClient = createClient
export { createClient as createServerClient }
