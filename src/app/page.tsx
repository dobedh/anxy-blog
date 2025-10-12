'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import BrunchPostCard from '@/components/BrunchPostCard';
import { getPosts } from '@/utils/supabasePostUtils';
import { Post } from '@/types/post';
import { useAuth } from '@/hooks/useAuth';
import { clearSupabaseCache } from '@/lib/supabase';


export default function Home() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const searchTerm = searchParams.get('q');

  const loadPosts = async () => {
    try {
      // 클라이언트 사이드에서만 실행
      if (typeof window === 'undefined') return;

      setIsLoading(true);
      console.log('🔄 Loading posts from Supabase...');

      // 검색어가 있으면 필터 적용
      const filters = searchTerm ? { searchTerm } : {};
      const userPosts = await getPosts(filters, 'newest');

      console.log('✅ Posts loaded successfully:', userPosts.length);
      setAllPosts(userPosts);
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      setAllPosts([]); // 에러 시 빈 배열 설정
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Detect OAuth redirect and clear Supabase cache
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);

      if (urlParams.has('_oauth_refresh')) {
        console.log('🔄 OAuth redirect detected - refreshing Supabase client');
        clearSupabaseCache();

        // Clean up URL
        urlParams.delete('_oauth_refresh');
        const cleanUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
        window.history.replaceState({}, '', cleanUrl);
      }

      loadPosts();
    }
  }, [pathname, searchTerm]); // pathname이나 searchTerm이 변경될 때마다 새로 로드

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
      {/* Search Result Header */}
      {searchTerm && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            "{searchTerm}" 검색 결과
            {!isLoading && <span className="text-gray-500 ml-2">({allPosts.length}건)</span>}
          </h2>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">
            {searchTerm ? '검색 중...' : '글을 불러오는 중...'}
          </p>
        </div>
      ) : (
        /* Posts Section */
        allPosts.length > 0 ? (
          <div className="space-y-0">
            {allPosts.map((post) => (
              <BrunchPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              {searchTerm ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-6 text-gray-300">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-500 text-sm mb-6">"{searchTerm}"에 대한 글을 찾을 수 없습니다.</p>
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    전체 글 보기
                  </a>
                </>
              ) : (
                <>
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
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      글쓰기
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
