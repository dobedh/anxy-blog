'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toggleFollow, checkFollowStatus } from '@/utils/supabaseFollowUtils';

interface FollowButtonProps {
  targetUserId: string;
  targetUsername: string;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'default' | 'compact';
}

export default function FollowButton({
  targetUserId,
  targetUsername,
  onFollowChange,
  variant = 'default'
}: FollowButtonProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 팔로우 상태 확인
  useEffect(() => {
    const checkFollow = async () => {
      if (currentUser && targetUserId && currentUser.id !== targetUserId) {
        const followStatus = await checkFollowStatus(currentUser.id, targetUserId);
        setIsFollowingUser(followStatus);
      }
    };

    checkFollow();
  }, [currentUser, targetUserId]);

  // 로그인하지 않았거나 현재 사용자가 없는 경우 버튼 숨김
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  // 본인 프로필인 경우 프로필 수정 버튼 표시
  if (currentUser.id === targetUserId) {
    return (
      <button
        onClick={() => router.push('/profile/edit')}
        className="px-6 py-2 rounded-full font-medium bg-surface text-foreground border border-border hover:bg-subtle transition-gentle focus-ring"
      >
        프로필 수정
      </button>
    );
  }

  const handleFollowToggle = async () => {
    if (!currentUser) return;

    setIsLoading(true);

    try {
      const result = await toggleFollow(currentUser.id, targetUserId);

      if (result.success) {
        setIsFollowingUser(result.isFollowing);

        // 부모 컴포넌트에 변경사항 알림
        onFollowChange?.(result.isFollowing);

        // 성공 메시지
        const action = result.isFollowing ? '팔로우' : '언팔로우';
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

  // 스타일 분기
  const getButtonClasses = () => {
    if (variant === 'compact') {
      return `px-4 py-1.5 text-sm font-medium rounded-full border border-gray-300 text-gray-700 transition-colors hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`;
    }

    return `px-6 py-2 rounded-full font-medium transition-gentle focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${
      isFollowingUser
        ? 'bg-surface text-foreground border border-border hover:bg-subtle'
        : 'bg-primary text-surface hover:bg-primary-hover'
    }`;
  };

  const getButtonText = () => {
    if (isLoading) {
      return variant === 'compact' ? '...' : (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          처리 중...
        </span>
      );
    }

    if (variant === 'compact') {
      return isFollowingUser ? 'Following' : 'Follow';
    }

    return isFollowingUser ? '팔로잉' : '팔로우';
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={getButtonClasses()}
    >
      {getButtonText()}
    </button>
  );
}