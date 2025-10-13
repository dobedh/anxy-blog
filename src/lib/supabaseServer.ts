import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
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

/**
 * Creates a Supabase admin client with service role key
 * This bypasses RLS and should only be used for admin operations on the server
 * NEVER expose this client or its credentials to the client-side
 */
export function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Creates a Supabase client for OAuth callbacks with response cookie handling
 * Compatible with Next.js 15 async cookies API
 * Returns both the client and an array of cookies to be set in NextResponse
 */
export async function createSupabaseServerClientWithResponse() {
  const cookieStore = await cookies()
  const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = []

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(newCookies) {
          newCookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options })
          })
        },
      },
    }
  )

  return { client, cookiesToSet }
}
