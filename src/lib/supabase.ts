import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase instance cache
let supabaseInstance: SupabaseClient | null = null

// 환경변수에서 Supabase 설정 가져오기 (하드코딩 완전 제거)
const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 디버깅 정보 추가
  console.log('🔍 Environment variable check:', {
    url_exists: !!url,
    url_type: typeof url,
    url_value: url ? `${url.substring(0, 20)}...` : 'undefined',
    key_exists: !!key,
    key_type: typeof key,
    key_length: key ? key.length : 0,
    is_browser: typeof window !== 'undefined',
    node_env: process.env.NODE_ENV
  })

  // 환경변수 엄격한 검증
  if (!url || url.trim() === '' || url === 'undefined') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL missing or invalid:', {
      value: url,
      type: typeof url,
      all_env_keys: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_'))
    })
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is required. Please set it in your environment variables. Current value: ${url}`)
  }

  if (!key || key.trim() === '' || key === 'undefined') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY missing or invalid:', {
      value: key ? `${key.substring(0, 10)}...` : key,
      type: typeof key,
      length: key ? key.length : 0
    })
    throw new Error(`NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please set it in your environment variables. Current value: ${key ? 'present but invalid' : 'missing'}`)
  }

  console.log('✅ Supabase config loaded from environment variables')
  return { url, key }
}

// Supabase 클라이언트 생성 함수 (완전한 lazy initialization)
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

// 함수 참조만 내보내기 (즉시 실행 완전 방지)
export const supabase = getSupabaseClient

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