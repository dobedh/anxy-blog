import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isEmailFormat, checkUsernameExists } from '@/utils/supabaseUserUtils'

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
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') {
      console.log('⏳ Server-side render, skipping auth initialization');
      return;
    }

    // 현재 세션 가져기기
    const getSession = async () => {
      try {
        console.log('🔄 Getting current session...');
        const { data: { session }, error } = await supabase().auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        console.log('✅ Session retrieved:', session ? 'authenticated' : 'not authenticated');
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false
        })
      } catch (error) {
        console.error('Error in getSession:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false
        })
      }
    }

    getSession()

    // 인증 상태 변화 리스너
    const { data: { subscription } } = supabase().auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? 'authenticated' : 'not authenticated');
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
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error

      // 프로필 생성
      if (data.user) {
        const { error: profileError } = await supabase()
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
      const { data, error } = await supabase().auth.signInWithPassword({
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

  // 이메일 또는 닉네임으로 로그인
  const signInWithEmailOrUsername = async (emailOrUsername: string, password: string) => {
    try {
      // 입력값이 이메일 형식인지 확인
      if (isEmailFormat(emailOrUsername)) {
        // 이메일로 직접 로그인
        return await signIn(emailOrUsername, password)
      } else {
        // 닉네임으로 간주하고 사용자 존재 여부 확인
        const usernameExists = await checkUsernameExists(emailOrUsername)

        if (!usernameExists) {
          return {
            data: null,
            error: { message: '존재하지 않는 사용자명입니다.' }
          }
        }

        // 닉네임이 존재하면 이메일을 입력하라고 안내
        return {
          data: null,
          error: {
            message: `'${emailOrUsername}' 계정으로 로그인하려면 해당 계정의 이메일 주소를 입력해주세요.`,
            isUsernameLogin: true,
            username: emailOrUsername
          }
        }
      }
    } catch (error) {
      console.error('Error signing in with email or username:', error)
      return { data: null, error }
    }
  }

  // 구글 OAuth 로그인
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase().auth.signInWithOAuth({
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

  // TODO: 카카오 OAuth 로그인 - 추후 업데이트 예정
  // const signInWithKakao = async () => {
  //   try {
  //     const { data, error } = await supabase.auth.signInWithOAuth({
  //       provider: 'kakao',
  //       options: {
  //         redirectTo: `${window.location.origin}/auth/callback`
  //       }
  //     })

  //     if (error) throw error
  //     return { data, error: null }
  //   } catch (error) {
  //     console.error('Error signing in with Kakao:', error)
  //     return { data: null, error }
  //   }
  // }

  // 로그아웃
  const signOut = async () => {
    try {
      const { error } = await supabase().auth.signOut()
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
      const { data, error } = await supabase()
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
    signInWithEmailOrUsername,
    signInWithGoogle,
    // signInWithKakao, // TODO: 추후 업데이트 예정
    signOut,
    checkUsernameAvailability
  }
}