'use client';

import { useState } from 'react';

interface Author {
  id: string;
  name: string;
  bio: string;
  followers: number;
  isFollowing: boolean;
  avatar?: string;
}

const mockAuthors: Author[] = [
  {
    id: '1',
    name: '마음챙김여행자',
    bio: '불안과 함께 살아가는 방법을 나누는 여행자',
    followers: 1248,
    isFollowing: false,
  },
  {
    id: '2',
    name: '따뜻한글귀',
    bio: '일상 속 작은 위로를 전하고 싶어요',
    followers: 892,
    isFollowing: true,
  },
  {
    id: '3',
    name: '음악치료사',
    bio: '치유하는 음악들을 소개합니다',
    followers: 756,
    isFollowing: false,
  },
  {
    id: '4',
    name: '책읽는마음',
    bio: '마음을 다독이는 책들을 추천해요',
    followers: 634,
    isFollowing: false,
  },
  {
    id: '5',
    name: '산책하는사람',
    bio: '걷기와 명상으로 찾은 평온함을 나눕니다',
    followers: 523,
    isFollowing: true,
  },
  {
    id: '6',
    name: '일상의위로',
    bio: '소소한 일상 속 행복을 발견하고 있어요',
    followers: 445,
    isFollowing: false,
  },
];

export default function RecommendedAuthors() {
  const [authors, setAuthors] = useState<Author[]>(mockAuthors);

  const handleFollow = (authorId: string) => {
    setAuthors(prev =>
      prev.map(author =>
        author.id === authorId
          ? {
              ...author,
              isFollowing: !author.isFollowing,
              followers: author.isFollowing ? author.followers - 1 : author.followers + 1
            }
          : author
      )
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">추천 작가</h3>
      <div className="space-y-4">
        {authors.map((author) => (
          <div key={author.id} className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-brunch-light-green rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-brunch-green">
                {author.name.charAt(0)}
              </span>
            </div>

            {/* Author Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-author-name font-semibold text-sm hover:text-brunch-green-hover cursor-pointer">
                    {author.name}
                  </h4>
                  <p className="text-xs text-brunch-gray mt-1 line-clamp-2">
                    {author.bio}
                  </p>
                  <p className="text-xs text-brunch-gray mt-1">
                    {author.followers.toLocaleString()}명이 팔로우
                  </p>
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(author.id)}
                  className={`ml-2 px-3 py-1 text-xs font-medium rounded-full transition-colors flex-shrink-0 ${
                    author.isFollowing
                      ? 'bg-brunch-green text-white hover:bg-brunch-green-hover'
                      : 'border border-brunch-green text-brunch-green hover:bg-brunch-light-green'
                  }`}
                >
                  {author.isFollowing ? '팔로잉' : '팔로우'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See More */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="text-sm text-brunch-green hover:text-brunch-green-hover font-medium">
          작가 더 보기
        </button>
      </div>
    </div>
  );
}