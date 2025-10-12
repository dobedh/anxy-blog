import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isEmailFormat, checkUsernameExists } from '@/utils/supabaseUserUtils'
import { logger } from '@/lib/logger'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

/**
 * OAuth redirect URL 검증
 * Open redirect 공격 방지를 위한 origin 화이트리스트 검증
 */
function getValidatedRedirectUrl(): string {
  // 서버 사이드에서는 기본 URL 반환
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  const currentOrigin = window.location.origin;

  // 환경변수에서 허용된 origin 목록 가져오기
  const allowedOrigins = (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  // 기본 허용 URL (환경변수가 없을 경우 fallback)
  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  const finalAllowedOrigins = allowedOrigins.length > 0
    ? allowedOrigins
    : defaultAllowedOrigins;

  // 현재 origin이 화이트리스트에 있는지 확인
  const isOriginAllowed = finalAllowedOrigins.some(allowedOrigin => {
    // Vercel preview deployments 지원 (와일드카드 패턴)
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*').replace(/\./g, '\\.');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentOrigin);
    }
    return currentOrigin === allowedOrigin;
  });

  // 검증 통과 시 현재 origin 사용, 실패 시 기본 URL 사용
  if (isOriginAllowed) {
    logger.debug({
      context: 'redirectValidation',
      metadata: { origin: currentOrigin, validated: true }
    });
    return `${currentOrigin}/auth/callback`;
  } else {
    // 검증 실패 시 경고 로그 및 안전한 기본 URL 사용
    logger.warn({
      context: 'redirectValidation',
      metadata: {
        origin: currentOrigin,
        validated: false,
        reason: 'origin_not_in_whitelist'
      }
    });
    const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${fallbackUrl}/auth/callback`;
  }
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
      logger.debug({ context: 'authInit', metadata: { ssr: true } });
      return;
    }

    // 현재 세션 가져기기
    const getSession = async () => {
      try {
        logger.debug({ context: 'getSession', metadata: { status: 'fetching' } });
        const { data: { session }, error } = await supabase().auth.getSession()
        if (error) {
          logger.error({ context: 'getSession', error });
        }
        logger.debug({
          context: 'getSession',
          metadata: { authenticated: !!session }
        });
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false
        })
      } catch (error) {
        logger.error({ context: 'getSession', error });
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
        logger.debug({
          context: 'authStateChange',
          metadata: { event, authenticated: !!session }
        });
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
    bio?: string
  }) => {
    try {
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: {
          data: {
            username: metadata.username,
            bio: metadata.bio
          }
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
            bio: metadata.bio || ''
          })

        if (profileError) throw profileError
      }

      return { data, error: null }
    } catch (error: any) {
      logger.error({
        context: 'signUp',
        error,
        metadata: { action: 'user_registration' }
      });

      // Provide more specific error message if available
      const errorMessage = error?.message || '회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';

      return {
        data: null,
        error: { message: errorMessage }
      }
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
    } catch (error: any) {
      logger.error({
        context: 'signIn',
        error,
        metadata: { action: 'password_login' }
      });
      return {
        data: null,
        error: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
      }
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
            error: { message: '존재하지 않는 닉네임입니다.' }
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
    } catch (error: any) {
      logger.error({
        context: 'signInWithEmailOrUsername',
        error,
        metadata: { action: 'flexible_login' }
      });
      return {
        data: null,
        error: { message: '로그인에 실패했습니다. 입력 정보를 확인해주세요.' }
      }
    }
  }

  // 구글 OAuth 로그인
  const signInWithGoogle = async () => {
    try {
      const redirectUrl = getValidatedRedirectUrl();

      const { data, error } = await supabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      logger.error({
        context: 'signInWithGoogle',
        error,
        metadata: { action: 'oauth_login', provider: 'google' }
      });
      return {
        data: null,
        error: { message: '구글 로그인 중 문제가 발생했습니다.' }
      }
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
    } catch (error: any) {
      logger.error({
        context: 'signOut',
        error,
        metadata: { action: 'logout' }
      });
      return {
        error: { message: '로그아웃 중 문제가 발생했습니다.' }
      }
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
  }
}