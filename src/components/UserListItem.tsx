'use client';

import Link from 'next/link';
import { User } from '@/types/user';

interface UserListItemProps {
  user: User;
  onClick?: (username: string) => void;
}

export default function UserListItem({ user, onClick }: UserListItemProps) {
  const handleClick = () => {
    onClick?.(user.username);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg"
    >
      {/* 프로필 이미지 */}
      <div className="w-12 h-12 bg-brunch-light-green rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-lg font-semibold text-gray-700">
          {user.displayName.charAt(0)}
        </span>
      </div>

      {/* 사용자 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">
            {user.displayName}
          </h3>
        </div>
        <p className="text-sm text-gray-500 truncate">
          @{user.username}
        </p>
        {user.bio && (
          <p className="text-sm text-gray-600 mt-1 truncate">
            {user.bio}
          </p>
        )}
      </div>

      {/* 화살표 아이콘 */}
      <div className="flex-shrink-0">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
}