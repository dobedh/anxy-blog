import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성 함수 (브라우저용 - PKCE 코드 검증기를 쿠키에 저장)
// NOTE: 싱글톤 캐싱 제거됨 - @supabase/ssr이 내부적으로 세션을 쿠키를 통해 관리하므로
// 매번 새로운 클라이언트를 생성해도 현재 인증 세션이 올바르게 적용됩니다.
// 이를 통해 RLS 정책이 auth.uid()를 정확하게 인식할 수 있습니다.
export const getSupabaseClient = (): SupabaseClient => {
  // 서버 사이드 렌더링 중에는 클라이언트 생성 안 함
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient should only be called on the client side')
  }

  // 환경변수 가져오기 - 함수 내부에서 동적으로 읽기 (HMR 대응)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

  // Supabase 클라이언트 생성 - @supabase/ssr 사용으로 PKCE 코드 검증기가 쿠키에 저장됨
  // 매번 새로운 클라이언트 생성하지만 세션은 쿠키를 통해 자동으로 유지됩니다
  try {
    const client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Supabase browser client created with current session')
    }

    return client
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error)
    throw error
  }
}

/**
 * @deprecated Singleton caching removed - no longer needed
 * This function is kept for backwards compatibility but does nothing
 */
export const clearSupabaseCache = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('ℹ️ clearSupabaseCache called but singleton caching is disabled')
  }
}

// OAuth 콜백용 클라이언트 - getSupabaseClient와 동일하게 동작
export const createCallbackClient = (): SupabaseClient => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Creating callback client with current session')
  }
  return getSupabaseClient()
}

// 함수 참조 내보내기 - 모든 utils에서 supabase()로 호출
// Arrow function으로 변경하여 Turbopack HMR 캐싱 이슈 방지
export const supabase = () => getSupabaseClient()

// 타입 정의
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
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
