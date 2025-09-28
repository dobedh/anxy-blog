'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { getFollowers, getFollowing } from '@/utils/supabaseFollowUtils';
import UserListItem from './UserListItem';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  initialCount: number;
}

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  type,
  initialCount
}: FollowersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const LIMIT = 20;

  // 모달 닫기 처리 (ESC키)
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 외부 클릭으로 모달 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 데이터 로드
  const loadUsers = async (reset: boolean = false) => {
    setLoading(true);

    try {
      const currentOffset = reset ? 0 : offset;
      const result = type === 'followers'
        ? await getFollowers(userId, currentOffset, LIMIT)
        : await getFollowing(userId, currentOffset, LIMIT);

      if (reset) {
        setUsers(result[type] || []);
        setOffset(LIMIT);
      } else {
        setUsers(prev => [...prev, ...(result[type] || [])]);
        setOffset(prev => prev + LIMIT);
      }

      setHasMore((result[type]?.length || 0) === LIMIT);
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 데이터 초기화 및 로드
  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setOffset(0);
      setHasMore(true);
      loadUsers(true);
    }
  }, [isOpen, userId, type]);

  // 사용자 클릭 처리
  const handleUserClick = (username: string) => {
    router.push(`/u/${username}`);
    onClose();
  };

  const title = type === 'followers' ? '팔로워' : '팔로잉';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {title} ({initialCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="모달 닫기"
          >
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto">
          {loading && users.length === 0 ? (
            /* 초기 로딩 */
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : users.length === 0 ? (
            /* 빈 상태 */
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {type === 'followers' ? '아직 팔로워가 없습니다' : '아직 팔로우한 사용자가 없습니다'}
              </h3>
              <p className="text-gray-500 text-sm">
                {type === 'followers'
                  ? '다른 사용자들이 이 계정을 팔로우하면 여기에 표시됩니다'
                  : '관심 있는 사용자를 팔로우해보세요'
                }
              </p>
            </div>
          ) : (
            /* 사용자 목록 */
            <div className="p-2">
              {users.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onClick={handleUserClick}
                />
              ))}

              {/* 더 보기 버튼 */}
              {hasMore && (
                <div className="text-center p-4">
                  <button
                    onClick={() => loadUsers(false)}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        로딩 중...
                      </span>
                    ) : (
                      '더 보기'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}