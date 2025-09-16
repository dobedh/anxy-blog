'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PostCard from '@/components/PostCard';
import { getPosts } from '@/utils/postUtils';
import { Post } from '@/types/post';
import { useAuth } from '@/hooks/useAuth';

const mockPosts: Post[] = [
  {
    id: 'mock_1',
    title: '불안할 때 듣는 음악들',
    content: '요즘 밤에 잠이 오지 않을 때면 이런 음악들을 듣곤 합니다. 마음이 차분해지는 느낌이에요. 클래식부터 재즈까지, 제가 정말 사랑하는 곡들을 모아봤어요. 특히 에릭 사티의 지노페디나 막스 리히터의 곡들이 좋더라고요.',
    excerpt: '요즘 밤에 잠이 오지 않을 때면 이런 음악들을 듣곤 합니다. 마음이 차분해지는 느낌이에요. 클래식부터 재즈까지, 제가 정말 사랑하는 곡들을 모아봤어요.',
    author: '익명',
    category: '음악',
    date: '2시간 전',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 24,
    comments: 8,
    isAnonymous: true,
    isPrivate: false,
  },
  {
    id: 'mock_2',
    title: '오늘 하루도 견뎌냈네요',
    content: '작은 성취라도 나 자신을 칭찬해주고 싶습니다. 모든 분들도 오늘 하루 고생하셨어요. 때로는 그냥 하루를 버텨낸 것만으로도 충분히 대단한 일이라고 생각해요. 우리 모두 정말 잘하고 있는 거예요.',
    excerpt: '작은 성취라도 나 자신을 칭찬해주고 싶습니다. 모든 분들도 오늘 하루 고생하셨어요. 때로는 그냥 하루를 버텨낸 것만으로도 충분히 대단한 일이라고 생각해요.',
    author: '따뜻한마음',
    category: '생각',
    date: '3시간 전',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    likes: 42,
    comments: 12,
    isAnonymous: false,
    isPrivate: false,
  },
  {
    id: 'mock_3',
    title: '추천하고 싶은 책 - 불안을 다스리는 법',
    content: '최근에 읽은 책인데 정말 도움이 많이 되었습니다. 불안감을 객관적으로 바라보는 방법에 대해 구체적으로 설명해주는 책이었어요. 실용적인 팁들이 가득했습니다. 인지치료 기법들도 쉽게 설명되어 있어서 일상에 적용하기 좋더라고요.',
    excerpt: '최근에 읽은 책인데 정말 도움이 많이 되었습니다. 불안감을 객관적으로 바라보는 방법에 대해 구체적으로 설명해주는 책이었어요. 실용적인 팁들이 가득했습니다.',
    author: '책벌레',
    category: '책',
    date: '5시간 전',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 18,
    comments: 6,
    isAnonymous: false,
    isPrivate: false,
  },
  {
    id: 'mock_4',
    title: '혼자 있는 시간이 무서워요',
    content: '집에 혼자 있으면 계속 부정적인 생각들만 떠올라서 힘들어요. 비슷한 경험 있으신 분들 계신가요? 어떻게 극복하셨는지도 궁금합니다. 요즘에는 정말 외로움이 심해져서 어떻게 해야 할지 모르겠어요.',
    excerpt: '집에 혼자 있으면 계속 부정적인 생각들만 떠올라서 힘들어요. 비슷한 경험 있으신 분들 계신가요? 어떻게 극복하셨는지도 궁금합니다.',
    author: '익명',
    category: '자유',
    date: '8시간 전',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    likes: 31,
    comments: 15,
    isAnonymous: true,
    isPrivate: false,
  },
  {
    id: 'mock_5',
    title: '산책의 힘',
    content: '매일 30분씩 산책을 시작한지 한 달이 되었습니다. 작은 변화지만 마음이 조금씩 평온해지는 것 같아요. 자연을 보면서 걷다 보면 생각이 정리되는 느낌입니다. 특히 아침 산책을 추천드려요. 하루가 다르게 시작되는 느낌이에요.',
    excerpt: '매일 30분씩 산책을 시작한지 한 달이 되었습니다. 작은 변화지만 마음이 조금씩 평온해지는 것 같아요. 자연을 보면서 걷다 보면 생각이 정리되는 느낌입니다.',
    author: '걷는사람',
    category: '생각',
    date: '12시간 전',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    likes: 28,
    comments: 9,
    isAnonymous: false,
    isPrivate: false,
  },
  {
    id: 'mock_6',
    title: '함께 들으면 좋은 플레이리스트',
    content: '불안한 밤을 위한 잔잔한 음악들을 모아봤습니다. 혹시 도움이 되실까 해서 공유드려요. 인디부터 일렉트로니카까지 다양한 장르로 구성했어요. 스포티파이 링크도 함께 남겨두겠습니다. 좋은 밤 되세요!',
    excerpt: '불안한 밤을 위한 잔잔한 음악들을 모아봤습니다. 혹시 도움이 되실까 해서 공유드려요. 인디부터 일렉트로니카까지 다양한 장르로 구성했어요.',
    author: '음악친구',
    category: '음악',
    date: '1일 전',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: 56,
    comments: 23,
    isAnonymous: false,
    isPrivate: false,
  }
];

export default function Home() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'for-you' | 'featured'>('for-you');
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const loadPosts = () => {
    // postUtils의 통합 함수 사용 (localStorage에서 사용자 작성글 로드)
    const userPosts = getPosts({}, 'newest');
    
    // 사용자 글과 기본 글을 합쳐서 최신순으로 정렬
    const combinedPosts = [...userPosts, ...mockPosts];
    
    // 최신순으로 정렬 (createdAt 기준)
    combinedPosts.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.date).getTime();
      const bDate = new Date(b.createdAt || b.date).getTime();
      return bDate - aDate;
    });
    
    setAllPosts(combinedPosts);
  };

  useEffect(() => {
    loadPosts();
  }, [pathname]); // pathname이 변경될 때마다 새로 로드

  // Filter posts based on active tab
  const displayedPosts = activeTab === 'for-you' 
    ? allPosts // For now, show all posts in "For you". Later: filter by following
    : allPosts.filter(post => !post.isPrivate); // Featured: show public posts only

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('for-you')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'for-you'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            For you
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'featured'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Featured
          </button>
        </nav>
      </div>

      {/* Posts Section */}
      <div className="space-y-6">
        {displayedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-12">
        <button className="text-green-600 font-medium hover:text-green-700 transition-colors">
          더 많은 글 보기
        </button>
      </div>
    </div>
  );
}
