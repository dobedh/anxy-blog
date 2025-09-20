import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true
  })

  useEffect(() => {
    // 현재 세션 가져오기
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      }
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false
      })
    }

    getSession()

    // 인증 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 이메일/비밀번호 회원가입
  const signUp = async (email: string, password: string, metadata: {
    username: string
    display_name: string
    bio?: string
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error

      // 프로필 생성
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: metadata.username,
            display_name: metadata.display_name,
            bio: metadata.bio || ''
          })

        if (profileError) throw profileError
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error signing up:', error)
      return { data: null, error }
    }
  }

  // 이메일/비밀번호 로그인
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { data: null, error }
    }
  }

  // 구글 OAuth 로그인
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      return { data: null, error }
    }
  }

  // 카카오 OAuth 로그인 (네이버 대신 카카오 사용 - Supabase에서 더 쉽게 지원)
  const signInWithKakao = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error signing in with Kakao:', error)
      return { data: null, error }
    }
  }

  // 로그아웃
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error }
    }
  }

  // 사용자명 중복 체크
  const checkUsernameAvailability = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)

      if (error) {
        console.error('Error checking username:', error)
        return { available: false, error }
      }

      // data가 빈 배열이면 사용 가능, 데이터가 있으면 사용 불가
      return { available: !data || data.length === 0, error: null }
    } catch (error) {
      console.error('Error checking username:', error)
      return { available: false, error }
    }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    checkUsernameAvailability
  }
}