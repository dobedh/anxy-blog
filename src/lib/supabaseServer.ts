import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for Route Handlers with proper cookie handling
 * This ensures OAuth sessions are properly propagated from server to client
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookie setting can fail during OAuth callback
            // This is expected and will be handled by the response cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle error silently
          }
        },
      },
    }
  )
}
