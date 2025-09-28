import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase instance cache
let supabaseInstance: SupabaseClient | null = null

// Development fallback values (hardcoded for reliability)
const DEVELOPMENT_CONFIG = {
  url: 'https://izijmvvdtabhohdaoyzl.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6aWptdnZkdGFiaG9oZGFveXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODgwNTYsImV4cCI6MjA3Mzg2NDA1Nn0.DxyiKMEw-k4hzRAU5B86_HsVGynqLKkLzLlordWyJJk'
}

// Robust environment variable getter
const getSupabaseConfig = () => {
  // Try to get from environment variables first
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check for empty strings, undefined, or null
  if (!url || url.trim() === '' || url === 'undefined') {
    console.warn('NEXT_PUBLIC_SUPABASE_URL not found, using development fallback')
    url = DEVELOPMENT_CONFIG.url
  }

  if (!key || key.trim() === '' || key === 'undefined') {
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY not found, using development fallback')
    key = DEVELOPMENT_CONFIG.key
  }

  // Final validation
  if (!url || !key) {
    console.error('Supabase configuration failed:', { url: !!url, key: !!key })
    throw new Error('Supabase configuration is required and could not be resolved.')
  }

  console.log('Supabase config loaded:', {
    url: url.substring(0, 30) + '...',
    keyLength: key.length,
    source: url === DEVELOPMENT_CONFIG.url ? 'fallback' : 'env'
  })

  return { url, key }
}

// Simplified Supabase client getter
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    try {
      const { url, key } = getSupabaseConfig()
      supabaseInstance = createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
      console.log('✅ Supabase client initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error)
      throw error
    }
  }
  return supabaseInstance
}

// Backward compatibility
export const createCallbackClient = (): SupabaseClient => {
  return getSupabaseClient()
}

// Direct client initialization with try-catch
let clientInstance: SupabaseClient | null = null

export const supabase = (() => {
  if (!clientInstance) {
    try {
      clientInstance = getSupabaseClient()
    } catch (error) {
      console.error('Failed to initialize supabase client:', error)
      // Return a minimal mock client for development
      clientInstance = {
        auth: {},
        from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      } as any
    }
  }
  return clientInstance
})()

// 타입 정의
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          bio: string
          avatar_url: string | null
          is_private: boolean
          allow_follow: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          bio?: string
          avatar_url?: string | null
          is_private?: boolean
          allow_follow?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          bio?: string
          avatar_url?: string | null
          is_private?: boolean
          allow_follow?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          excerpt: string | null
          author_id: string | null
          author_name: string
          is_anonymous: boolean
          is_private: boolean
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          excerpt?: string | null
          author_id?: string | null
          author_name: string
          is_anonymous?: boolean
          is_private?: boolean
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          excerpt?: string | null
          author_id?: string | null
          author_name?: string
          is_anonymous?: boolean
          is_private?: boolean
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          author_name: string
          content: string
          is_anonymous: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          author_name: string
          content: string
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          author_name?: string
          content?: string
          is_anonymous?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type PostLike = Database['public']['Tables']['post_likes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']