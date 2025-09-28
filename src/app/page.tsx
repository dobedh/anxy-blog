'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BrunchPostCard from '@/components/BrunchPostCard';
import { getPosts } from '@/utils/supabasePostUtils';
import { Post } from '@/types/post';
import { useAuth } from '@/hooks/useAuth';


export default function Home() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const loadPosts = async () => {
    try {
      // 클라이언트 사이드에서만 실행
      if (typeof window === 'undefined') return;

      console.log('🔄 Loading posts from Supabase...');
      const userPosts = await getPosts({}, 'newest');
      console.log('✅ Posts loaded successfully:', userPosts.length);
      setAllPosts(userPosts);
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      setAllPosts([]); // 에러 시 빈 배열 설정
    }
  };

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      loadPosts();
    }
  }, [pathname]); // pathname이 변경될 때마다 새로 로드

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Posts Section */}
      {allPosts.length > 0 ? (
        <>
          <div className="space-y-0">
            {allPosts.map((post) => (
              <BrunchPostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
              더 보기
            </button>
          </div>
        </>
      ) : (
        // Empty State
        <div className="py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 text-gray-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">아직 작성된 글이 없습니다</h3>
            <p className="text-gray-500 text-sm mb-6">첫 번째 글을 작성해 보세요. 당신의 이야기를 기다리고 있습니다.</p>
            {isAuthenticated && (
              <a
                href="/write"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                글쓰기
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
