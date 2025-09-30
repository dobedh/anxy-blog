// Post-related types for Anxy blog platform

export interface Post {
  id: number | string;
  title: string;
  content: string;
  excerpt: string;
  author: string;          // 기존 필드 (호환성 유지)
  authorId?: string;       // 새로운 필드 - 사용자 ID 참조
  authorName?: string;     // 표시용 작성자 이름
  date: string;
  createdAt?: string;      // ISO 날짜 형식
  updatedAt?: string;      // 수정일
  likes: number;
  comments: number;
  isAnonymous?: boolean;   // 익명 글 여부
  isPrivate?: boolean;     // 비공개 글 여부
  thumbnail?: string;      // 썸네일 이미지 URL
  thumbnailAlt?: string;   // 썸네일 이미지 설명 (접근성)
}

// 새 글 생성용 인터페이스
export interface CreatePostData {
  title: string;
  content: string;
  isAnonymous?: boolean;
  isPrivate?: boolean;
}

// 임시저장용 인터페이스
export interface DraftPostData extends CreatePostData {
  savedAt: string; // ISO 날짜 형식
  userId: string;  // 임시저장본 소유자
}

// 글 업데이트용 인터페이스
export interface UpdatePostData {
  title?: string;
  content?: string;
  isAnonymous?: boolean;
  isPrivate?: boolean;
}

// 글 목록 필터링용
export interface PostFilters {
  authorId?: string;
  isPrivate?: boolean;
  searchTerm?: string;
}

// 글 정렬 옵션
export type PostSortOption = 'newest' | 'oldest' | 'mostLiked' | 'mostCommented';

// localStorage 키
export const POST_STORAGE_KEYS = {
  POSTS: 'anxy_posts',
  USER_POSTS: 'userPosts', // 기존 키 (호환성 유지)
  DRAFT_POST: 'anxy_draft_post', // 임시저장용 키
} as const;


// 기존 글 구조 (마이그레이션용)
export interface LegacyPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  content?: string;
}