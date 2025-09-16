'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { followUser, unfollowUser, isFollowing } from '@/utils/followUtils';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ 
  targetUserId, 
  targetUsername,
  onFollowChange 
}: FollowButtonProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 팔로우 상태 확인
  useEffect(() => {
    if (currentUser && targetUserId) {
      const followStatus = isFollowing(currentUser.id, targetUserId);
      setIsFollowingUser(followStatus);
    }
  }, [currentUser, targetUserId]);

  // 로그인하지 않았거나 본인인 경우 버튼 숨김
  if (!isAuthenticated || !currentUser || currentUser.id === targetUserId) {
    return null;
  }

  const handleFollowToggle = async () => {
    if (!currentUser) return;

    setIsLoading(true);

    try {
      let result;
      
      if (isFollowingUser) {
        result = unfollowUser(currentUser.id, targetUserId);
      } else {
        result = followUser(currentUser.id, targetUserId);
      }

      if (result.success) {
        const newFollowStatus = !isFollowingUser;
        setIsFollowingUser(newFollowStatus);
        
        // 부모 컴포넌트에 변경사항 알림
        onFollowChange?.(newFollowStatus);
        
        // 성공 메시지
        const action = newFollowStatus ? '팔로우' : '언팔로우';
        console.log(`${targetUsername}님을 ${action}했습니다.`);
      } else {
        alert(result.error || '작업 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
      alert('작업 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`px-6 py-2 rounded-full font-medium transition-gentle focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowingUser
          ? 'bg-surface text-foreground border border-border hover:bg-subtle'
          : 'bg-primary text-surface hover:bg-primary-hover'
      }`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          처리 중...
        </span>
      ) : isFollowingUser ? (
        '팔로잉'
      ) : (
        '팔로우'
      )}
    </button>
  );
}