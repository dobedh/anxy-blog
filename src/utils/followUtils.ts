import { getUserById } from './userUtils';

// Follow-related types
export interface FollowData {
  followerId: string; // 팔로우하는 사람
  followingId: string; // 팔로우당하는 사람
  createdAt: string;
}

// localStorage 키
export const FOLLOW_STORAGE_KEY = 'anxy_follows';

// localStorage에서 팔로우 데이터 로드
export function loadFollows(): FollowData[] {
  try {
    const followsData = localStorage.getItem(FOLLOW_STORAGE_KEY);
    return followsData ? JSON.parse(followsData) : [];
  } catch (error) {
    console.error('Failed to load follows:', error);
    return [];
  }
}

// localStorage에 팔로우 데이터 저장
export function saveFollows(follows: FollowData[]): void {
  try {
    localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(follows));
  } catch (error) {
    console.error('Failed to save follows:', error);
    throw new Error('팔로우 데이터 저장에 실패했습니다.');
  }
}

// 특정 사용자를 팔로우
export function followUser(
  followerId: string, 
  followingId: string
): { success: boolean; error?: string } {
  try {
    // 본인 팔로우 방지
    if (followerId === followingId) {
      return { success: false, error: '자기 자신을 팔로우할 수 없습니다.' };
    }

    // 사용자 존재 여부 확인
    const follower = getUserById(followerId);
    const following = getUserById(followingId);
    
    if (!follower) {
      return { success: false, error: '팔로우하는 사용자를 찾을 수 없습니다.' };
    }
    
    if (!following) {
      return { success: false, error: '팔로우할 사용자를 찾을 수 없습니다.' };
    }

    const follows = loadFollows();
    
    // 이미 팔로우 중인지 확인
    const existingFollow = follows.find(
      f => f.followerId === followerId && f.followingId === followingId
    );
    
    if (existingFollow) {
      return { success: false, error: '이미 팔로우 중입니다.' };
    }

    // 새 팔로우 관계 추가
    const newFollow: FollowData = {
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    };

    follows.push(newFollow);
    saveFollows(follows);
    
    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: '팔로우 중 오류가 발생했습니다.' };
  }
}

// 특정 사용자 언팔로우
export function unfollowUser(
  followerId: string, 
  followingId: string
): { success: boolean; error?: string } {
  try {
    const follows = loadFollows();
    
    // 팔로우 관계 찾기
    const followIndex = follows.findIndex(
      f => f.followerId === followerId && f.followingId === followingId
    );
    
    if (followIndex === -1) {
      return { success: false, error: '팔로우하지 않는 사용자입니다.' };
    }

    // 팔로우 관계 제거
    follows.splice(followIndex, 1);
    saveFollows(follows);
    
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: '언팔로우 중 오류가 발생했습니다.' };
  }
}

// 팔로우 여부 확인
export function isFollowing(followerId: string, followingId: string): boolean {
  try {
    const follows = loadFollows();
    return follows.some(
      f => f.followerId === followerId && f.followingId === followingId
    );
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

// 특정 사용자의 팔로워 수
export function getFollowerCount(userId: string): number {
  try {
    const follows = loadFollows();
    return follows.filter(f => f.followingId === userId).length;
  } catch (error) {
    console.error('Error getting follower count:', error);
    return 0;
  }
}

// 특정 사용자의 팔로잉 수
export function getFollowingCount(userId: string): number {
  try {
    const follows = loadFollows();
    return follows.filter(f => f.followerId === userId).length;
  } catch (error) {
    console.error('Error getting following count:', error);
    return 0;
  }
}

// 특정 사용자의 팔로워 목록
export function getFollowers(userId: string): string[] {
  try {
    const follows = loadFollows();
    return follows
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
}

// 특정 사용자의 팔로잉 목록
export function getFollowing(userId: string): string[] {
  try {
    const follows = loadFollows();
    return follows
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
  } catch (error) {
    console.error('Error getting following:', error);
    return [];
  }
}