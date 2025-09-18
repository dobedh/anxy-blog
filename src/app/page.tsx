'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BrunchPostCard from '@/components/BrunchPostCard';
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
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
    thumbnailAlt: '음악 스튜디오의 마이크와 헤드폰',
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
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
    thumbnailAlt: '따뜻한 햇살이 비추는 창가',
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
    thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop',
    thumbnailAlt: '책이 펼쳐져 있는 도서관 책상',
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
    thumbnail: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=300&h=200&fit=crop',
    thumbnailAlt: '창밖을 바라보는 실루엣',
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
    thumbnail: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=300&h=200&fit=crop',
    thumbnailAlt: '숲속 산책로',
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
    thumbnail: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=200&fit=crop',
    thumbnailAlt: '음악을 듣는 사람의 실루엣',
  }
];

export default function Home() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Posts Section */}
      <div className="space-y-0">
        {allPosts.map((post) => (
          <BrunchPostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More */}
      {allPosts.length > 0 && (
        <div className="text-center mt-12">
          <button className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
