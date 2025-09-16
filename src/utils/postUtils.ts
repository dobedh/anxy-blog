import { 
  Post, 
  CreatePostData, 
  UpdatePostData, 
  PostFilters, 
  PostSortOption, 
  LegacyPost,
  POST_STORAGE_KEYS,
  CATEGORIES 
} from '@/types/post';
import { getUserById } from './userUtils';

// 고유 ID 생성 함수
function generatePostId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2);
  return `post_${timestamp}_${randomStr}`;
}

// excerpt 자동 생성
export function generateExcerpt(content: string, maxLength: number = 150): string {
  if (!content) return '';
  
  const plainText = content.replace(/<[^>]*>/g, ''); // HTML 태그 제거
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength).trim() + '...';
}

// localStorage에서 글 데이터 로드
export function loadPosts(): Post[] {
  try {
    // 새로운 형식 먼저 시도
    const postsData = localStorage.getItem(POST_STORAGE_KEYS.POSTS);
    if (postsData) {
      return JSON.parse(postsData);
    }
    
    // 기존 형식 (userPosts) 폴백
    const legacyPostsData = localStorage.getItem(POST_STORAGE_KEYS.USER_POSTS);
    if (legacyPostsData) {
      const legacyPosts: LegacyPost[] = JSON.parse(legacyPostsData);
      return legacyPosts.map(migrateLegacyPost);
    }
    
    return [];
  } catch (error) {
    console.error('Failed to load posts:', error);
    return [];
  }
}

// localStorage에 글 데이터 저장
export function savePosts(posts: Post[]): void {
  try {
    localStorage.setItem(POST_STORAGE_KEYS.POSTS, JSON.stringify(posts));
  } catch (error) {
    console.error('Failed to save posts:', error);
    throw new Error('글 데이터 저장에 실패했습니다.');
  }
}

// 기존 글 구조를 새 구조로 마이그레이션
export function migrateLegacyPost(legacyPost: LegacyPost): Post {
  return {
    id: legacyPost.id.toString(),
    title: legacyPost.title,
    content: legacyPost.content || legacyPost.excerpt,
    excerpt: legacyPost.excerpt,
    author: legacyPost.author,
    authorId: undefined, // 기존 글은 작성자 ID가 없음
    authorName: legacyPost.author,
    category: legacyPost.category,
    date: legacyPost.date,
    createdAt: new Date().toISOString(), // 임시 생성일
    likes: legacyPost.likes,
    comments: legacyPost.comments,
    isAnonymous: legacyPost.author === '익명',
    isPrivate: false,
  };
}

// 새 글 생성
export function createPost(
  data: CreatePostData, 
  authorId: string
): { success: boolean; post?: Post; error?: string } {
  try {
    // 사용자 정보 조회
    const author = getUserById(authorId);
    if (!author) {
      return { success: false, error: '작성자 정보를 찾을 수 없습니다.' };
    }
    
    // 글 검증
    if (!data.title.trim()) {
      return { success: false, error: '제목을 입력해주세요.' };
    }
    
    if (!data.content.trim()) {
      return { success: false, error: '내용을 입력해주세요.' };
    }
    
    // 카테고리 검증
    const validCategory = CATEGORIES.find(cat => cat.value === data.category);
    if (!validCategory) {
      return { success: false, error: '올바른 카테고리를 선택해주세요.' };
    }
    
    // 새 글 객체 생성
    const now = new Date().toISOString();
    const newPost: Post = {
      id: generatePostId(),
      title: data.title.trim(),
      content: data.content.trim(),
      excerpt: generateExcerpt(data.content),
      author: data.isAnonymous ? '익명' : author.displayName,
      authorId: data.isAnonymous ? undefined : authorId,
      authorName: author.displayName,
      category: validCategory.label,
      date: '방금 전',
      createdAt: now,
      updatedAt: now,
      likes: 0,
      comments: 0,
      isAnonymous: data.isAnonymous || false,
      isPrivate: data.isPrivate || false,
    };
    
    // 저장
    const posts = loadPosts();
    posts.unshift(newPost); // 맨 앞에 추가
    savePosts(posts);
    
    return { success: true, post: newPost };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: '글 작성 중 오류가 발생했습니다.' };
  }
}

// 글 업데이트
export function updatePost(
  postId: string, 
  updates: UpdatePostData,
  authorId: string
): { success: boolean; post?: Post; error?: string } {
  try {
    const posts = loadPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
      return { success: false, error: '글을 찾을 수 없습니다.' };
    }
    
    const post = posts[postIndex];
    
    // 권한 체크 (본인 글이거나 익명 글인 경우)
    if (post.authorId && post.authorId !== authorId) {
      return { success: false, error: '글을 수정할 권한이 없습니다.' };
    }
    
    // 업데이트
    const updatedPost: Post = {
      ...post,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // excerpt 재생성 (내용이 변경된 경우)
    if (updates.content) {
      updatedPost.excerpt = generateExcerpt(updates.content);
    }
    
    posts[postIndex] = updatedPost;
    savePosts(posts);
    
    return { success: true, post: updatedPost };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, error: '글 수정 중 오류가 발생했습니다.' };
  }
}

// 글 삭제
export function deletePost(postId: string, authorId: string): { success: boolean; error?: string } {
  try {
    const posts = loadPosts();
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
      return { success: false, error: '글을 찾을 수 없습니다.' };
    }
    
    const post = posts[postIndex];
    
    // 권한 체크
    if (post.authorId && post.authorId !== authorId) {
      return { success: false, error: '글을 삭제할 권한이 없습니다.' };
    }
    
    posts.splice(postIndex, 1);
    savePosts(posts);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: '글 삭제 중 오류가 발생했습니다.' };
  }
}

// 글 목록 조회 (필터링 및 정렬)
export function getPosts(
  filters?: PostFilters,
  sortBy: PostSortOption = 'newest'
): Post[] {
  try {
    let posts = loadPosts();
    
    // 필터링
    if (filters) {
      if (filters.authorId) {
        posts = posts.filter(post => post.authorId === filters.authorId);
      }
      
      if (filters.category) {
        posts = posts.filter(post => post.category === filters.category);
      }
      
      if (filters.isPrivate !== undefined) {
        posts = posts.filter(post => post.isPrivate === filters.isPrivate);
      }
      
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        posts = posts.filter(post => 
          post.title.toLowerCase().includes(searchTerm) ||
          post.content.toLowerCase().includes(searchTerm) ||
          post.excerpt.toLowerCase().includes(searchTerm)
        );
      }
    }
    
    // 정렬
    switch (sortBy) {
      case 'newest':
        posts.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        break;
      case 'oldest':
        posts.sort((a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime());
        break;
      case 'mostLiked':
        posts.sort((a, b) => b.likes - a.likes);
        break;
      case 'mostCommented':
        posts.sort((a, b) => b.comments - a.comments);
        break;
    }
    
    return posts;
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
}

// ID로 글 조회
export function getPostById(postId: string): Post | undefined {
  const posts = loadPosts();
  return posts.find(post => post.id === postId);
}

// 사용자별 글 개수
export function getPostCountByAuthor(authorId: string): number {
  const posts = loadPosts();
  return posts.filter(post => post.authorId === authorId).length;
}

// 특정 사용자의 글 목록 조회
export function getPostsByAuthor(authorId: string, sortBy: PostSortOption = 'newest'): Post[] {
  return getPosts({ authorId, isPrivate: false }, sortBy);
}

// 기존 데이터 마이그레이션 실행
export function migratePostData(): { success: boolean; migratedCount: number } {
  try {
    // 이미 새 형식으로 저장된 데이터가 있는지 체크
    const existingPosts = localStorage.getItem(POST_STORAGE_KEYS.POSTS);
    if (existingPosts) {
      return { success: true, migratedCount: 0 }; // 이미 마이그레이션됨
    }
    
    // 기존 userPosts 데이터 로드
    const legacyPostsData = localStorage.getItem(POST_STORAGE_KEYS.USER_POSTS);
    if (!legacyPostsData) {
      return { success: true, migratedCount: 0 }; // 마이그레이션할 데이터 없음
    }
    
    const legacyPosts: LegacyPost[] = JSON.parse(legacyPostsData);
    const migratedPosts = legacyPosts.map(migrateLegacyPost);
    
    // 새 형식으로 저장
    savePosts(migratedPosts);
    
    return { success: true, migratedCount: migratedPosts.length };
  } catch (error) {
    console.error('Error migrating post data:', error);
    return { success: false, migratedCount: 0 };
  }
}