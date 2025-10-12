import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase instance cache
let supabaseInstance: SupabaseClient | null = null

// Supabase 클라이언트 생성 함수
export const getSupabaseClient = (): SupabaseClient => {
  // 클라이언트가 이미 있으면 반환
  if (supabaseInstance) {
    return supabaseInstance
  }

  // 환경변수 가져오기 - 함수 내부에서 동적으로 읽기 (HMR 대응)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 개발 환경에서 환경 변수 디버깅
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔍 Supabase Environment Check:', {
      url_exists: !!SUPABASE_URL,
      key_exists: !!SUPABASE_ANON_KEY,
      url_value: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'undefined',
    })
  }

  // 환경 변수 검증
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const errorMsg = `
      ❌ Supabase 환경 변수가 설정되지 않았습니다.

      필요한 환경 변수:
      - NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? '✅ 설정됨' : '❌ 누락'}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락'}

      해결 방법:
      1. .env.local 파일에 환경 변수가 있는지 확인
      2. 환경 변수 이름이 정확한지 확인 (NEXT_PUBLIC_ 접두사 필수)
      3. 개발 서버를 재시작 (npm run dev)
      4. Vercel에 배포한 경우 환경 변수 설정 확인
    `
    console.error(errorMsg)
    throw new Error('Missing Supabase environment variables. Check console for details.')
  }

  // Supabase 클라이언트 생성
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Supabase client initialized successfully')
    }

    return supabaseInstance
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error)
    throw error
  }
}

// OAuth 콜백용 클라이언트 - 동일한 싱글톤 인스턴스 반환
export const createCallbackClient = (): SupabaseClient => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Creating callback client (same singleton instance)')
  }
  return getSupabaseClient()
}

// 함수 참조 내보내기 - 모든 utils에서 supabase()로 호출
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
          category: string
          is_anonymous: boolean
          visibility: string
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
          category: string
          is_anonymous?: boolean
          visibility?: string
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
          category?: string
          is_anonymous?: boolean
          visibility?: string
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