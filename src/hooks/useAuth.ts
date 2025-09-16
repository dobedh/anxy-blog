import { useCallback } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { loginUser, signupUser, logoutUser } from '@/utils/userUtils';
import { LoginCredentials, SignupData, AuthUser } from '@/types/user';

interface UseAuthReturn {
  // 상태
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // 액션
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // 유틸리티
  isCurrentUser: (userId: string) => boolean;
}

export function useAuth(): UseAuthReturn {
  const { state, login: contextLogin, logout: contextLogout, isCurrentUser } = useUserContext();
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const result = await Promise.resolve(loginUser(credentials));
      
      if (result.success && result.user) {
        contextLogin(result.user);
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  }, [contextLogin]);
  
  const signup = useCallback(async (data: SignupData) => {
    try {
      const result = await Promise.resolve(signupUser(data));
      
      if (result.success && result.user) {
        contextLogin(result.user);
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    }
  }, [contextLogin]);
  
  const logout = useCallback(() => {
    try {
      logoutUser();
      contextLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [contextLogout]);
  
  return {
    // 상태
    currentUser: state.currentUser,
    isAuthenticated: !!state.currentUser,
    isLoading: state.isLoading,
    
    // 액션
    login,
    signup,
    logout,
    
    // 유틸리티
    isCurrentUser,
  };
}