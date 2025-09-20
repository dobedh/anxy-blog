import { useCallback, useEffect, useState } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '@/lib/supabase';
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
  signInWithKakao: () => Promise<{ success: boolean; error?: string }>;

  // 유틸리티
  isCurrentUser: (userId: string) => boolean;
  checkUsernameAvailability: (username: string) => Promise<{ available: boolean; error?: any }>;
}

export function useAuth(): UseAuthReturn {
  const { user, loading, signIn, signUp, signOut, signInWithGoogle, signInWithKakao, checkUsernameAvailability } = useSupabaseAuth();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Supabase User를 AuthUser로 변환
  useEffect(() => {
    const convertUser = async () => {
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            setCurrentUser(null);
            return;
          }

          setCurrentUser({
            id: user.id,
            username: profile.username,
            displayName: profile.display_name,
            email: user.email,
            avatarUrl: profile.avatar_url
          });
        } catch (error) {
          console.error('Error converting user:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };

    convertUser();
  }, [user]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const { data, error } = await signIn(credentials.email, credentials.password);

      if (error) {
        return { success: false, error: error.message || '로그인에 실패했습니다.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  }, [signIn]);

  const signup = useCallback(async (data: SignupData) => {
    try {
      // 사용자명 중복 체크
      const { available, error: checkError } = await checkUsernameAvailability(data.username);

      if (checkError) {
        return { success: false, error: '사용자명 확인 중 오류가 발생했습니다.' };
      }

      if (!available) {
        return { success: false, error: '이미 사용 중인 사용자명입니다.' };
      }

      const { data: authData, error } = await signUp(
        data.email,
        data.password,
        {
          username: data.username,
          display_name: data.displayName,
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
  }, [signUp, checkUsernameAvailability]);

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

  const handleKakaoSignIn = useCallback(async () => {
    try {
      const { data, error } = await signInWithKakao();

      if (error) {
        return { success: false, error: error.message || '카카오 로그인에 실패했습니다.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Kakao sign-in error:', error);
      return { success: false, error: '카카오 로그인 중 오류가 발생했습니다.' };
    }
  }, [signInWithKakao]);

  const isCurrentUser = useCallback((userId: string) => {
    return currentUser?.id === userId;
  }, [currentUser]);

  return {
    // 상태
    currentUser,
    isAuthenticated: !!user, // user가 있으면 인증된 것으로 처리
    isLoading: loading,

    // 액션
    login,
    signup,
    logout,

    // OAuth 액션
    signInWithGoogle: handleGoogleSignIn,
    signInWithKakao: handleKakaoSignIn,

    // 유틸리티
    isCurrentUser,
    checkUsernameAvailability,
  };
}