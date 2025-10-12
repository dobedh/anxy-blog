'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getUserLikedPosts } from '@/utils/supabasePostUtils';
import { Post } from '@/types/post';
import BrunchPostCard from '@/components/BrunchPostCard';

export default function LikesPage() {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // 로그인 상태 확인 - 타이밍 이슈 방지 로직
  useEffect(() => {
    console.log('🔍 Likes page auth check:', {
      isLoading,
      isAuthenticated,
      currentUser: currentUser ? 'exists' : 'null',
      willCheckRedirect: !isLoading && !isAuthenticated
    });

    if (!isLoading && !isAuthenticated) {
      // React 상태 동기화를 위한 짧은 지연
      const redirectTimer = setTimeout(() => {
        // 상태 안정화 후 재확인
        if (!isAuthenticated) {
          console.log('🔒 Likes page requires authentication - redirecting to home');
          router.push('/');
        } else {
          console.log('✅ Authentication confirmed - staying on likes page');
        }
      }, 100);

      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, isLoading, router]);

  // 좋아요한 글 목록 로드
  useEffect(() => {
    const loadLikedPosts = async () => {
      if (!currentUser) return;

      console.log('👤 Loading liked posts for user:', {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email
      });

      setIsLoadingPosts(true);
      setError(null);

      try {
        const result = await getUserLikedPosts(currentUser.id, 0, 20);
        console.log('📥 Liked posts result:', result);

        if (result.error) {
          setError(result.error);
        } else {
          setPosts(result.posts);
          setTotal(result.total);
          setHasMore(result.posts.length < result.total);
        }
      } catch (err) {
        console.error('Error loading liked posts:', err);
        setError('좋아요한 글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingPosts(false);
      }
    };

    if (currentUser) {
      loadLikedPosts();
    }
  }, [currentUser]);

  // 더 많은 글 로드
  const loadMorePosts = async () => {
    if (!currentUser || isLoadingPosts || !hasMore) return;

    setIsLoadingPosts(true);

    try {
      const result = await getUserLikedPosts(currentUser.id, posts.length, 20);

      if (result.error) {
        setError(result.error);
      } else {
        setPosts(prev => [...prev, ...result.posts]);
        setHasMore(posts.length + result.posts.length < result.total);
      }
    } catch (err) {
      console.error('Error loading more liked posts:', err);
      setError('더 많은 글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // 로딩 중이거나 사용자 정보가 없을 때
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="pt-16 lg:pt-24 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
        {/* 헤더 */}
        <div className="mb-12 text-center">
          <h1 className="text-hero font-bold text-foreground mb-4">
            좋아요 한 글
          </h1>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 좋아요한 글 목록 */}
        {posts.length === 0 && !isLoadingPosts ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 bg-subtle rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-title font-semibold text-foreground mb-3">
              아직 좋아요한 글이 없습니다
            </h2>
            <p className="text-body text-muted mb-8">
              마음에 드는 글에 좋아요를 눌러보세요
            </p>
            <Link
              href="/"
              className="inline-block bg-primary text-surface px-6 py-3 rounded-lg text-body font-medium hover:bg-primary-hover transition-gentle focus-ring cursor-pointer"
            >
              글 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 글 목록 */}
            <div className="grid gap-8">
              {posts.map((post) => (
                <BrunchPostCard key={post.id} post={post} />
              ))}
            </div>

            {/* 더 보기 버튼 */}
            {hasMore && (
              <div className="text-center pt-8">
                <button
                  onClick={loadMorePosts}
                  disabled={isLoadingPosts}
                  className="bg-accent text-primary px-8 py-3 rounded-lg text-body font-medium hover:bg-border transition-gentle focus-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingPosts ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                      로딩 중...
                    </div>
                  ) : (
                    '더 많은 글 보기'
                  )}
                </button>
              </div>
            )}

            {/* 로딩 스피너 */}
            {isLoadingPosts && posts.length === 0 && (
              <div className="text-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted">좋아요한 글을 불러오는 중...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}