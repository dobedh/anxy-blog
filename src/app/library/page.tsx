'use client';

import { useState, useEffect } from 'react';
import BrunchPostCard from '@/components/BrunchPostCard';
import { Post } from '@/types/post';

export default function LibraryPage() {
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Load liked posts from localStorage
    const savedLikedPosts = localStorage.getItem('anxy_liked_posts');
    if (savedLikedPosts) {
      try {
        const likedPostIds = JSON.parse(savedLikedPosts) as string[];

        // Get all posts and filter by liked IDs
        const allPostsStr = localStorage.getItem('anxy_posts');
        if (allPostsStr) {
          const allPosts = JSON.parse(allPostsStr) as Post[];
          const filteredPosts = allPosts.filter(post => likedPostIds.includes(post.id));
          setLikedPosts(filteredPosts);
        }
      } catch (error) {
        console.error('Error loading liked posts:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Page Header */}
        <div className="py-12 border-b border-gray-200">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Library
          </h1>
          <p className="text-gray-500">
            좋아요 한 글들을 모아보세요
          </p>
        </div>

        {/* Posts List */}
        <div className="divide-y divide-gray-100">
          {likedPosts.length > 0 ? (
            likedPosts.map(post => (
              <BrunchPostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-lg">
                아직 좋아요 한 글이 없습니다
              </p>
              <p className="text-gray-400 text-sm mt-2">
                마음에 드는 글을 발견하면 좋아요를 눌러보세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}