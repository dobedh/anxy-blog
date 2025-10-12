'use client';

import { useState, useEffect } from 'react';
import { getUsers } from '@/utils/supabaseUserUtils';
import { User } from '@/types/user';

export default function RecommendedAuthors() {
  const [authors, setAuthors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuthors = async () => {
      try {
        const { users } = await getUsers(0, 6); // Get first 6 users
        setAuthors(users);
      } catch (error) {
        console.error('Error loading authors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthors();
  }, []);

  const handleFollow = (authorId: string) => {
    // TODO: Implement real follow functionality with Supabase
    console.log('Follow/unfollow:', authorId);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 작가</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (authors.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 작가</h3>
        <p className="text-gray-500 text-sm">아직 추천할 작가가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 작가</h3>
      <div className="space-y-4">
        {authors.map((author) => (
          <div key={author.id} className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-blue-600">
                {author.username.charAt(0)}
              </span>
            </div>

            {/* Author Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-gray-900 font-semibold text-sm hover:text-blue-600 cursor-pointer">
                    {author.username}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    @{author.username}
                  </p>
                  {author.bio && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {author.bio}
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(author.id)}
                  className="ml-2 px-3 py-1 text-xs font-medium rounded-full transition-colors flex-shrink-0 border border-blue-600 text-blue-600 hover:bg-blue-50 cursor-pointer"
                >
                  팔로우
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See More */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
          작가 더 보기
        </button>
      </div>
    </div>
  );
}