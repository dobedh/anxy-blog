import { useCallback, useMemo } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { updateUser, getUserStats } from '@/utils/userUtils';
import { User, UpdateUserData, UserStats } from '@/types/user';

interface UseUserReturn {
  // 사용자 조회
  getUserById: (userId: string) => User | undefined;
  getUserByUsername: (username: string) => User | undefined;
  getAllUsers: () => User[];
  
  // 사용자 업데이트
  updateUser: (userId: string, updates: UpdateUserData) => Promise<{ success: boolean; error?: string }>;
  
  // 사용자 통계
  getUserStats: (userId: string) => UserStats;
  
  // 상태
  users: Record<string, User>;
  isLoading: boolean;
}

export function useUser(): UseUserReturn {
  const { 
    state, 
    updateUser: contextUpdateUser, 
    getUserById: contextGetUserById, 
    getUserByUsername: contextGetUserByUsername 
  } = useUserContext();
  
  const updateUserData = useCallback(async (userId: string, updates: UpdateUserData) => {
    try {
      const result = await Promise.resolve(updateUser(userId, updates));
      
      if (result.success && result.user) {
        contextUpdateUser(userId, updates);
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
    }
  }, [contextUpdateUser]);
  
  const getAllUsers = useCallback(() => {
    return Object.values(state.users);
  }, [state.users]);
  
  const getUserStatsData = useCallback((userId: string) => {
    return getUserStats(userId);
  }, []);
  
  return {
    // 사용자 조회
    getUserById: contextGetUserById,
    getUserByUsername: contextGetUserByUsername,
    getAllUsers,
    
    // 사용자 업데이트
    updateUser: updateUserData,
    
    // 사용자 통계
    getUserStats: getUserStatsData,
    
    // 상태
    users: state.users,
    isLoading: state.isLoading,
  };
}

// 특정 사용자 정보를 가져오는 hook
interface UseUserProfileReturn {
  user: User | undefined;
  stats: UserStats | undefined;
  isLoading: boolean;
  isCurrentUser: boolean;
  updateProfile: (updates: UpdateUserData) => Promise<{ success: boolean; error?: string }>;
}

export function useUserProfile(userId?: string): UseUserProfileReturn {
  const { getUserById, getUserStats, updateUser, isLoading } = useUser();
  const { isCurrentUser: checkIsCurrentUser } = useUserContext();
  
  const user = useMemo(() => {
    return userId ? getUserById(userId) : undefined;
  }, [userId, getUserById]);
  
  const stats = useMemo(() => {
    return userId ? getUserStats(userId) : undefined;
  }, [userId, getUserStats]);
  
  const isCurrentUser = useMemo(() => {
    return userId ? checkIsCurrentUser(userId) : false;
  }, [userId, checkIsCurrentUser]);
  
  const updateProfile = useCallback(async (updates: UpdateUserData) => {
    if (!userId) {
      return { success: false, error: '사용자 ID가 필요합니다.' };
    }
    
    return updateUser(userId, updates);
  }, [userId, updateUser]);
  
  return {
    user,
    stats,
    isLoading,
    isCurrentUser,
    updateProfile,
  };
}

// 닉네임으로 프로필을 가져오는 hook
export function useUserProfileByUsername(username?: string): UseUserProfileReturn {
  const { getUserByUsername } = useUser();
  
  const user = useMemo(() => {
    return username ? getUserByUsername(username) : undefined;
  }, [username, getUserByUsername]);
  
  return useUserProfile(user?.id);
}