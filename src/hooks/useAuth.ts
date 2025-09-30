import { useCallback, useEffect, useState } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { getSupabaseClient } from '@/lib/supabase';
import { checkUsernameAvailability as supabaseCheckUsername } from '@/utils/supabaseUserUtils';
import { LoginCredentials, SignupData, AuthUser, OAuthSignupData } from '@/types/user';

interface UseAuthReturn {
  // 상태
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 액션
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // OAuth 액션
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  // signInWithKakao: () => Promise<{ success: boolean; error?: string }>; // TODO: 추후 업데이트 예정

  // 유틸리티
  isCurrentUser: (userId: string) => boolean;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; error?: unknown }>;
  refreshCurrentUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { user, loading, signIn, signInWithEmailOrUsername, signUp, signOut, signInWithGoogle /* signInWithKakao, */ } = useSupabaseAuth();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Supabase User를 AuthUser로 변환 (완전한 클라이언트 사이드 실행)
  useEffect(() => {
    const convertUser = async () => {
      // 클라이언트 사이드에서만 실행
      if (typeof window === 'undefined') {
        console.log('⏳ Server-side render, skipping user conversion');
        return;
      }

      // 인증 로딩이 완료되기 전까지는 처리하지 않음
      if (loading) {
        setIsReady(false);
        return;
      }

      if (user) {
        setUserLoading(true);
        try {
          console.log('🔄 Converting user profile...');
          const supabaseClient = getSupabaseClient();
          const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching profile:', error);
            setCurrentUser(null);
          } else if (!profile) {
            // 프로필이 없을 경우 기본 사용자 정보로 설정
            console.log('Profile not found, creating minimal user object');
            setCurrentUser({
              id: user.id,
              username: user.email?.split('@')[0] || 'unknown',
              email: user.email,
              avatarUrl: user.user_metadata?.avatar_url || null,
              bio: ''
            });
          } else {
            setCurrentUser({
              id: user.id,
              username: profile.username,
              email: user.email,
              avatarUrl: profile.avatar_url,
              bio: profile.bio
            });
          }
        } catch (error) {
          console.error('Error converting user:', error);
          setCurrentUser(null);
        } finally {
          setUserLoading(false);
          setIsReady(true);
        }
      } else {
        // 사용자가 없으면 즉시 상태 정리
        setCurrentUser(null);
        setUserLoading(false);
        setIsReady(true);
      }
    };

    convertUser();
  }, [user, loading]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const { data, error } = await signInWithEmailOrUsername(credentials.email, credentials.password);

      if (error) {
        return { success: false, error: error.message || '로그인에 실패했습니다.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  }, [signInWithEmailOrUsername]);

  const signup = useCallback(async (data: SignupData) => {
    try {
      // 닉네임 중복 체크
      const available = await supabaseCheckUsername(data.username);
      if (!available) {
        return { success: false, error: '이미 사용 중인 닉네임입니다.' };
      }


      const { data: authData, error } = await signUp(
        data.email,
        data.password,
        {
          username: data.username,
          bio: data.bio
        }
      );

      if (error) {
        return { success: false, error: error.message || '회원가입에 실패했습니다.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    }
  }, [signUp]);

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [signOut]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        return { success: false, error: error.message || '구글 로그인에 실패했습니다.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { success: false, error: '구글 로그인 중 오류가 발생했습니다.' };
    }
  }, [signInWithGoogle]);

  // TODO: 카카오 로그인 - 추후 업데이트 예정
  // const handleKakaoSignIn = useCallback(async () => {
  //   try {
  //     const { data, error } = await signInWithKakao();

  //     if (error) {
  //       return { success: false, error: error.message || '카카오 로그인에 실패했습니다.' };
  //     }

  //     return { success: true };
  //   } catch (error) {
  //     console.error('Kakao sign-in error:', error);
  //     return { success: false, error: '카카오 로그인 중 오류가 발생했습니다.' };
  //   }
  // }, [signInWithKakao]);

  const isCurrentUser = useCallback((userId: string) => {
    return currentUser?.id === userId;
  }, [currentUser]);

  // 닉네임 중복 체크 wrapper 함수
  const checkUsernameAvailability = useCallback(async (username: string) => {
    try {
      const available = await supabaseCheckUsername(username);
      return { available, error: null };
    } catch (error) {
      console.error('Error checking username availability:', error);
      return { available: false, error };
    }
  }, []);

  // 현재 사용자 정보 수동 새로고침
  const refreshCurrentUser = useCallback(async () => {
    if (!user) {
      console.log('No user to refresh');
      return;
    }

    if (typeof window === 'undefined') {
      console.log('Server-side render, skipping user refresh');
      return;
    }

    setUserLoading(true);
    try {
      console.log('🔄 Refreshing current user profile...');
      const supabaseClient = getSupabaseClient();
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error refreshing profile:', error);
        return;
      }

      if (!profile) {
        console.log('Profile not found during refresh');
        return;
      }

      const refreshedUser: AuthUser = {
        id: user.id,
        username: profile.username,
        email: user.email,
        avatarUrl: profile.avatar_url,
        bio: profile.bio
      };

      setCurrentUser(refreshedUser);
      console.log('✅ User profile refreshed successfully:', profile.username);
    } catch (error) {
      console.error('Error refreshing user:', error);
    } finally {
      setUserLoading(false);
    }
  }, [user]);

  return {
    // 상태 - 동기화된 상태 제공
    currentUser,
    isAuthenticated: isReady && !!user && !!currentUser, // 모든 상태가 준비되고 동기화된 경우에만 true
    isLoading: loading || userLoading || !isReady, // 모든 로딩 상태를 통합

    // 액션
    login,
    signup,
    logout,

    // OAuth 액션
    signInWithGoogle: handleGoogleSignIn,
    // signInWithKakao: handleKakaoSignIn, // TODO: 추후 업데이트 예정

    // 유틸리티
    isCurrentUser,
    checkUsernameAvailability,
    refreshCurrentUser,
  };
}