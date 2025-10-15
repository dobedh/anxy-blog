import { supabase } from '@/lib/supabase';
import { Post as SupabasePost } from '@/lib/supabase';
import { Post, CreatePostData, UpdatePostData, PostFilters, PostSortOption } from '@/types/post';
import { getUserById } from './supabaseUserUtils';
import { createNotification } from './supabaseNotificationUtils';

// Supabase Post를 Post 타입으로 변환
export function convertSupabasePostToPost(supabasePost: any): Post {
  return {
    id: supabasePost.id,
    title: supabasePost.title,
    content: supabasePost.content,
    excerpt: supabasePost.excerpt || '',
    author: supabasePost.author_name,
    authorId: supabasePost.author_id || undefined,
    authorName: supabasePost.author_name,
    postNumber: supabasePost.post_number || undefined,
    date: formatDate(supabasePost.created_at),
    createdAt: supabasePost.created_at,
    updatedAt: supabasePost.updated_at,
    likes: supabasePost.likes_count,
    comments: supabasePost.comments_count,
    isAnonymous: supabasePost.is_anonymous,
    visibility: supabasePost.visibility || 'public',
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
      author_name: data.isAnonymous ? '익명' : author.username,
      category: '자유', // 기본 카테고리
      is_anonymous: data.isAnonymous || false,
      visibility: data.visibility || 'public',
    };

    // DB에 저장
    const { data: newPost, error } = await supabase()
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
    const { data: existingPost, error: fetchError } = await supabase()
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      return { success: false, error: '글을 찾을 수 없습니다.' };
    }

    if (!existingPost) {
      return { success: false, error: '글을 찾을 수 없습니다.' };
    }

    // 권한 체크 (본인 글이거나 익명 글인 경우)
    console.log('🔍 DEBUGGING UPDATEPOST PERMISSION:');
    console.log('existingPost.author_id:', existingPost.author_id, typeof existingPost.author_id);
    console.log('authorId parameter:', authorId, typeof authorId);
    console.log('Are they equal?', existingPost.author_id === authorId);
    console.log('existingPost object:', existingPost);

    if (existingPost.author_id && existingPost.author_id !== authorId) {
      console.log('❌ PERMISSION DENIED: author_id mismatch');
      return { success: false, error: '글을 수정할 권한이 없습니다.' };
    }

    console.log('✅ PERMISSION GRANTED: proceeding with update');

    // 업데이트 데이터 준비
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title) updateData.title = updates.title.trim();
    if (updates.content) {
      updateData.content = updates.content.trim();
      updateData.excerpt = generateExcerpt(updates.content);
    }
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;

    // 업데이트 실행
    const { data: updatedPost, error } = await supabase()
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
    const { data: existingPost, error: fetchError } = await supabase()
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching post:', fetchError);
      return { success: false, error: '글을 찾을 수 없습니다.' };
    }

    if (!existingPost) {
      return { success: false, error: '글을 찾을 수 없습니다.' };
    }

    // 권한 체크
    if (existingPost.author_id && existingPost.author_id !== authorId) {
      return { success: false, error: '글을 삭제할 권한이 없습니다.' };
    }

    // 삭제 실행
    const { error } = await supabase()
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
    // Debug: 현재 세션 확인 (RLS 정책이 auth.uid()를 제대로 인식하는지 확인)
    const client = supabase();
    const { data: { session } } = await client.auth.getSession();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 getPosts - Current session:', {
        userId: session?.user?.id || 'NOT AUTHENTICATED',
        hasSession: !!session,
        filters: filters
      });
    }

    let query = client
      .from('posts')
      .select('*');

    // 필터링
    if (filters) {
      if (filters.authorId) {
        query = query.eq('author_id', filters.authorId);
      }

      if (filters.visibility !== undefined) {
        query = query.eq('visibility', filters.visibility);
      }
      // RLS 정책이 visibility 필터링을 자동으로 처리합니다

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }
    }
    // RLS 정책이 visibility 필터링을 자동으로 처리합니다

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
    const { data: post, error } = await supabase()
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching post by ID:', error);
      return undefined;
    }

    if (!post) {
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
    const { count, error } = await supabase()
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('author_id', authorId);
      // RLS 정책이 visibility 필터링을 자동으로 처리합니다

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
  sortBy: PostSortOption = 'newest'
): Promise<Post[]> {
  const filters: PostFilters = {
    authorId
  };
  // RLS 정책이 visibility 필터링을 자동으로 처리합니다
  // 작성자 본인이면 모든 글을 볼 수 있고, 팔로워면 public+followers 글을, 그 외엔 public만 볼 수 있습니다

  return getPosts(filters, sortBy);
}

// 글 좋아요/취소
export async function togglePostLike(postId: string, userId: string): Promise<{ success: boolean; liked: boolean; error?: string }> {
  try {
    // 현재 좋아요 상태 확인
    const { data: existingLikes, error: checkError } = await supabase()
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .limit(1);

    if (checkError) {
      console.error('Error checking like status:', checkError);
      return { success: false, liked: false, error: '좋아요 상태 확인에 실패했습니다.' };
    }

    const existingLike = existingLikes && existingLikes.length > 0 ? existingLikes[0] : null;

    if (existingLike) {
      // 좋아요 취소
      const { error } = await supabase()
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
      const { error } = await supabase()
        .from('post_likes')
        .insert({
          user_id: userId,
          post_id: postId
        });

      if (error) {
        console.error('Error adding like:', error);
        return { success: false, liked: false, error: '좋아요 추가에 실패했습니다.' };
      }

      // 좋아요 성공 시 알림 생성 (자신의 글이 아닐 경우에만)
      try {
        // 글 정보 조회
        const post = await getPostById(postId);
        if (!post) {
          console.error('❌ NOTIFICATION FAILED: Could not fetch post data', {
            postId,
            userId
          });
          return { success: true, liked: true }; // Like succeeded even if notification failed
        }

        if (!post.authorId) {
          console.log('⚠️ NOTIFICATION SKIPPED: Post has no author (anonymous post)', {
            postId
          });
          return { success: true, liked: true };
        }

        if (post.authorId === userId) {
          console.log('⚠️ NOTIFICATION SKIPPED: User liked their own post', {
            postId,
            userId
          });
          return { success: true, liked: true };
        }

        // 좋아요한 사용자 정보 조회
        const likerUser = await getUserById(userId);
        if (!likerUser) {
          console.error('❌ NOTIFICATION FAILED: Could not fetch liker user data', {
            userId,
            postId
          });
          return { success: true, liked: true }; // Like succeeded even if notification failed
        }

        const notifResult = await createNotification({
          userId: post.authorId,
          actorId: userId,
          actorName: likerUser.username,
          actorAvatarUrl: likerUser.avatar || null,
          type: 'POST_LIKE',
          title: `${likerUser.username}님이 회원님의 글을 좋아합니다`,
          message: post.title,
          postId: postId,
          commentId: null
        });

        if (!notifResult.success) {
          console.error('❌ NOTIFICATION CREATION FAILED:', {
            error: notifResult.error,
            postId,
            userId,
            actorName: likerUser.username
          });
        } else {
          console.log('✅ Like notification created successfully');
        }
      } catch (notifError) {
        console.error('❌ UNEXPECTED ERROR in notification creation:', notifError);
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
    const { data, error } = await supabase()
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .limit(1);

    if (error) {
      console.error('Error checking user like status:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking if user liked post:', error);
    return false;
  }
}

// 사용자가 좋아요한 글 목록 조회
export async function getUserLikedPosts(
  userId: string,
  offset: number = 0,
  limit: number = 20
): Promise<{ posts: Post[]; total: number; error?: string }> {
  try {
    console.log('🔍 getUserLikedPosts called with userId:', userId, 'offset:', offset, 'limit:', limit);

    // 사용자가 좋아요한 글 ID 목록을 먼저 조회
    const { data: likedPostIds, error: likesError, count } = await supabase()
      .from('post_likes')
      .select('post_id', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('📊 Liked post IDs query result:', {
      likedPostIds,
      count,
      likesError
    });

    if (likesError) {
      console.error('Error fetching liked post IDs:', likesError);
      return { posts: [], total: 0, error: '좋아요한 글 목록을 불러올 수 없습니다.' };
    }

    if (!likedPostIds || likedPostIds.length === 0) {
      return { posts: [], total: count || 0 };
    }

    // 좋아요한 글의 상세 정보 조회
    const postIds = likedPostIds.map(like => like.post_id);

    const { data: posts, error: postsError } = await supabase()
      .from('posts')
      .select('*')
      .in('id', postIds)
      // RLS 정책이 visibility 필터링을 자동으로 처리합니다
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching liked posts:', postsError);
      return { posts: [], total: 0, error: '좋아요한 글을 불러올 수 없습니다.' };
    }

    // 좋아요한 순서대로 정렬 (post_likes 테이블의 순서를 따름)
    const sortedPosts = likedPostIds.map(like =>
      posts?.find(post => post.id === like.post_id)
    ).filter(Boolean);

    const convertedPosts = sortedPosts.map(post => convertSupabasePostToPost(post));

    return {
      posts: convertedPosts,
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting user liked posts:', error);
    return { posts: [], total: 0, error: '좋아요한 글 조회 중 오류가 발생했습니다.' };
  }
}

// username과 post_number로 글 조회 (짧은 URL용)
export async function getPostByUsernameAndNumber(username: string, postNumber: number): Promise<Post | undefined> {
  try {
    // 1. username으로 author_id 조회
    const { data: profile, error: profileError } = await supabase()
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return undefined;
    }

    if (!profile) {
      console.log('Profile not found for username:', username);
      return undefined;
    }

    // 2. author_id와 post_number로 글 조회
    const { data: post, error } = await supabase()
      .from('posts')
      .select('*')
      .eq('author_id', profile.id)
      .eq('post_number', postNumber)
      .maybeSingle();

    if (error) {
      console.error('Error fetching post by username and number:', error);
      return undefined;
    }

    if (!post) {
      console.log('Post not found for username:', username, 'postNumber:', postNumber);
      return undefined;
    }

    return convertSupabasePostToPost(post);
  } catch (error) {
    console.error('Error getting post by username and number:', error);
    return undefined;
  }
}
