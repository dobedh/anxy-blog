import { supabase } from '@/lib/supabase';
import { Post as SupabasePost } from '@/lib/supabase';
import { Post, CreatePostData, UpdatePostData, PostFilters, PostSortOption } from '@/types/post';
import { getUserById } from './supabaseUserUtils';

// Supabase Post를 Post 타입으로 변환
export function convertSupabasePostToPost(supabasePost: SupabasePost): Post {
  return {
    id: supabasePost.id,
    title: supabasePost.title,
    content: supabasePost.content,
    excerpt: supabasePost.excerpt || '',
    author: supabasePost.author_name,
    authorId: supabasePost.author_id || undefined,
    authorName: supabasePost.author_name,
    date: formatDate(supabasePost.created_at),
    createdAt: supabasePost.created_at,
    updatedAt: supabasePost.updated_at,
    likes: supabasePost.likes_count,
    comments: supabasePost.comments_count,
    isAnonymous: supabasePost.is_anonymous,
    isPrivate: supabasePost.is_private,
  };
}

// 날짜 포맷팅 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
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

// 새 글 생성
export async function createPost(
  data: CreatePostData,
  authorId: string
): Promise<{ success: boolean; post?: Post; error?: string }> {
  try {
    // 사용자 정보 조회
    const author = await getUserById(authorId);
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


    // 새 글 객체 생성
    const postData = {
      title: data.title.trim(),
      content: data.content.trim(),
      excerpt: generateExcerpt(data.content),
      author_id: data.isAnonymous ? null : authorId,
      author_name: data.isAnonymous ? '익명' : author.displayName,
      is_anonymous: data.isAnonymous || false,
      is_private: data.isPrivate || false,
    };

    // DB에 저장
    const { data: newPost, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return { success: false, error: '글 작성에 실패했습니다.' };
    }

    return { success: true, post: convertSupabasePostToPost(newPost) };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: '글 작성 중 오류가 발생했습니다.' };
  }
}

// 글 업데이트
export async function updatePost(
  postId: string,
  updates: UpdatePostData,
  authorId: string
): Promise<{ success: boolean; post?: Post; error?: string }> {
  try {
    // 기존 글 조회
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      return { success: false, error: '글을 찾을 수 없습니다.' };
    }

    // 권한 체크 (본인 글이거나 익명 글인 경우)
    if (existingPost.author_id && existingPost.author_id !== authorId) {
      return { success: false, error: '글을 수정할 권한이 없습니다.' };
    }

    // 업데이트 데이터 준비
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title) updateData.title = updates.title.trim();
    if (updates.content) {
      updateData.content = updates.content.trim();
      updateData.excerpt = generateExcerpt(updates.content);
    }
    if (updates.isPrivate !== undefined) updateData.is_private = updates.isPrivate;

    // 업데이트 실행
    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error);
      return { success: false, error: '글 수정에 실패했습니다.' };
    }

    return { success: true, post: convertSupabasePostToPost(updatedPost) };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, error: '글 수정 중 오류가 발생했습니다.' };
  }
}

// 글 삭제
export async function deletePost(postId: string, authorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 기존 글 조회
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      return { success: false, error: '글을 찾을 수 없습니다.' };
    }

    // 권한 체크
    if (existingPost.author_id && existingPost.author_id !== authorId) {
      return { success: false, error: '글을 삭제할 권한이 없습니다.' };
    }

    // 삭제 실행
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      return { success: false, error: '글 삭제에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: '글 삭제 중 오류가 발생했습니다.' };
  }
}

// 글 목록 조회 (필터링 및 정렬)
export async function getPosts(
  filters?: PostFilters,
  sortBy: PostSortOption = 'newest',
  offset: number = 0,
  limit: number = 20
): Promise<Post[]> {
  try {
    let query = supabase
      .from('posts')
      .select('*');

    // 필터링
    if (filters) {
      if (filters.authorId) {
        query = query.eq('author_id', filters.authorId);
      }

      if (filters.isPrivate !== undefined) {
        query = query.eq('is_private', filters.isPrivate);
      } else {
        // 기본적으로 공개 글만 조회
        query = query.eq('is_private', false);
      }

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }
    } else {
      // 기본적으로 공개 글만 조회
      query = query.eq('is_private', false);
    }

    // 정렬
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'mostLiked':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'mostCommented':
        query = query.order('comments_count', { ascending: false });
        break;
    }

    // 페이지네이션
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    return posts?.map(convertSupabasePostToPost) || [];
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
}

// ID로 글 조회
export async function getPostById(postId: string): Promise<Post | undefined> {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching post by ID:', error);
      }
      return undefined;
    }

    return convertSupabasePostToPost(post);
  } catch (error) {
    console.error('Error getting post by ID:', error);
    return undefined;
  }
}

// 사용자별 글 개수
export async function getPostCountByAuthor(authorId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('author_id', authorId)
      .eq('is_private', false);

    if (error) {
      console.error('Error getting post count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting post count by author:', error);
    return 0;
  }
}

// 특정 사용자의 글 목록 조회
export async function getPostsByAuthor(
  authorId: string,
  sortBy: PostSortOption = 'newest',
  includePrivate: boolean = false
): Promise<Post[]> {
  const filters: PostFilters = {
    authorId,
    isPrivate: includePrivate ? undefined : false
  };

  return getPosts(filters, sortBy);
}

// 글 좋아요/취소
export async function togglePostLike(postId: string, userId: string): Promise<{ success: boolean; liked: boolean; error?: string }> {
  try {
    // 현재 좋아요 상태 확인
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking like status:', checkError);
      return { success: false, liked: false, error: '좋아요 상태 확인에 실패했습니다.' };
    }

    if (existingLike) {
      // 좋아요 취소
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) {
        console.error('Error removing like:', error);
        return { success: false, liked: true, error: '좋아요 취소에 실패했습니다.' };
      }

      return { success: true, liked: false };
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('post_likes')
        .insert({
          user_id: userId,
          post_id: postId
        });

      if (error) {
        console.error('Error adding like:', error);
        return { success: false, liked: false, error: '좋아요 추가에 실패했습니다.' };
      }

      return { success: true, liked: true };
    }
  } catch (error) {
    console.error('Error toggling post like:', error);
    return { success: false, liked: false, error: '좋아요 처리 중 오류가 발생했습니다.' };
  }
}

// 사용자가 특정 글에 좋아요를 눌렀는지 확인
export async function checkUserLikedPost(postId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user like status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking if user liked post:', error);
    return false;
  }
}

