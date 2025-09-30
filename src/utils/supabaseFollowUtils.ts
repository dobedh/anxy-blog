import { supabase } from '@/lib/supabase';
import { Follow } from '@/lib/supabase';
import { getUserById } from './supabaseUserUtils';
import { User } from '@/types/user';

// 팔로우 관계 생성
export async function followUser(followerId: string, followingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 자기 자신을 팔로우하는 것 방지
    if (followerId === followingId) {
      return { success: false, error: '자기 자신을 팔로우할 수 없습니다.' };
    }

    // 팔로우할 사용자가 존재하는지 확인
    const followingUser = await getUserById(followingId);
    if (!followingUser) {
      return { success: false, error: '존재하지 않는 사용자입니다.' };
    }

    // 팔로우 허용 여부 확인
    if (!followingUser.allowFollow) {
      return { success: false, error: '이 사용자는 팔로우를 허용하지 않습니다.' };
    }

    // 이미 팔로우하고 있는지 확인
    const { data: existingFollow, error: checkError } = await supabase()
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing follow:', checkError);
      return { success: false, error: '팔로우 상태 확인에 실패했습니다.' };
    }

    if (existingFollow) {
      return { success: false, error: '이미 팔로우하고 있습니다.' };
    }

    // 팔로우 관계 생성
    const { error } = await supabase()
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      });

    if (error) {
      console.error('Error creating follow:', error);
      return { success: false, error: '팔로우에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: '팔로우 중 오류가 발생했습니다.' };
  }
}

// 언팔로우
export async function unfollowUser(followerId: string, followingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase()
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, error: '언팔로우에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: '언팔로우 중 오류가 발생했습니다.' };
  }
}

// 팔로우 상태 확인
export async function checkFollowStatus(followerId: string, followingId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase()
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) {
      console.error('Error checking follow status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

// 팔로우/언팔로우 토글
export async function toggleFollow(followerId: string, followingId: string): Promise<{ success: boolean; isFollowing: boolean; error?: string }> {
  try {
    const isCurrentlyFollowing = await checkFollowStatus(followerId, followingId);

    if (isCurrentlyFollowing) {
      const result = await unfollowUser(followerId, followingId);
      return {
        success: result.success,
        isFollowing: false,
        error: result.error
      };
    } else {
      const result = await followUser(followerId, followingId);
      return {
        success: result.success,
        isFollowing: result.success,
        error: result.error
      };
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    return {
      success: false,
      isFollowing: false,
      error: '팔로우 상태 변경 중 오류가 발생했습니다.'
    };
  }
}

// 팔로워 목록 조회
export async function getFollowers(
  userId: string,
  offset: number = 0,
  limit: number = 20
): Promise<{ followers: User[]; total: number }> {
  try {
    // 팔로워 ID 목록 조회
    const { data: followData, error: followError, count } = await supabase()
      .from('follows')
      .select('follower_id', { count: 'exact' })
      .eq('following_id', userId)
      .range(offset, offset + limit - 1);

    if (followError) {
      console.error('Error fetching followers:', followError);
      return { followers: [], total: 0 };
    }

    if (!followData || followData.length === 0) {
      return { followers: [], total: count || 0 };
    }

    // 팔로워 프로필 정보 조회
    const followerIds = followData.map(f => f.follower_id);
    const { data: profiles, error: profileError } = await supabase()
      .from('profiles')
      .select('*')
      .in('id', followerIds)
      .eq('is_private', false);

    if (profileError) {
      console.error('Error fetching follower profiles:', profileError);
      return { followers: [], total: count || 0 };
    }

    const followers: User[] = profiles?.map(profile => ({
      id: profile.id,
      username: profile.username,
      bio: profile.bio || '',
      avatar: profile.avatar_url || 'default',
      createdAt: profile.created_at,
      isPrivate: profile.is_private,
      allowFollow: profile.allow_follow,
    })) || [];

    return {
      followers,
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting followers:', error);
    return { followers: [], total: 0 };
  }
}

// 팔로잉 목록 조회
export async function getFollowing(
  userId: string,
  offset: number = 0,
  limit: number = 20
): Promise<{ following: User[]; total: number }> {
  try {
    // 팔로잉 ID 목록 조회
    const { data: followData, error: followError, count } = await supabase()
      .from('follows')
      .select('following_id', { count: 'exact' })
      .eq('follower_id', userId)
      .range(offset, offset + limit - 1);

    if (followError) {
      console.error('Error fetching following:', followError);
      return { following: [], total: 0 };
    }

    if (!followData || followData.length === 0) {
      return { following: [], total: count || 0 };
    }

    // 팔로잉 프로필 정보 조회
    const followingIds = followData.map(f => f.following_id);
    const { data: profiles, error: profileError } = await supabase()
      .from('profiles')
      .select('*')
      .in('id', followingIds)
      .eq('is_private', false);

    if (profileError) {
      console.error('Error fetching following profiles:', profileError);
      return { following: [], total: count || 0 };
    }

    const following: User[] = profiles?.map(profile => ({
      id: profile.id,
      username: profile.username,
      bio: profile.bio || '',
      avatar: profile.avatar_url || 'default',
      createdAt: profile.created_at,
      isPrivate: profile.is_private,
      allowFollow: profile.allow_follow,
    })) || [];

    return {
      following,
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting following:', error);
    return { following: [], total: 0 };
  }
}

// 팔로워 수 조회
export async function getFollowerCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase()
      .from('follows')
      .select('id', { count: 'exact' })
      .eq('following_id', userId);

    if (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting follower count:', error);
    return 0;
  }
}

// 팔로잉 수 조회
export async function getFollowingCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase()
      .from('follows')
      .select('id', { count: 'exact' })
      .eq('follower_id', userId);

    if (error) {
      console.error('Error getting following count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting following count:', error);
    return 0;
  }
}

// 상호 팔로우 여부 확인
export async function checkMutualFollow(userId1: string, userId2: string): Promise<boolean> {
  try {
    const [following1, following2] = await Promise.all([
      checkFollowStatus(userId1, userId2),
      checkFollowStatus(userId2, userId1)
    ]);

    return following1 && following2;
  } catch (error) {
    console.error('Error checking mutual follow:', error);
    return false;
  }
}

// 팔로잉한 사용자들의 최신 글 피드 조회
export async function getFollowingFeed(
  userId: string,
  offset: number = 0,
  limit: number = 20
) {
  try {
    // 팔로잉하는 사용자 ID 목록 조회
    const { data: followingData, error: followingError } = await supabase()
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followingError) {
      console.error('Error fetching following for feed:', followingError);
      return [];
    }

    if (!followingData || followingData.length === 0) {
      return [];
    }

    const followingIds = followingData.map(f => f.following_id);

    // 팔로잉한 사용자들의 글 조회
    const { data: posts, error: postsError } = await supabase()
      .from('posts')
      .select('*')
      .in('author_id', followingIds)
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Error fetching posts for feed:', postsError);
      return [];
    }

    return posts?.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      author: post.author_name,
      authorId: post.author_id || undefined,
      authorName: post.author_name,
      category: post.category,
      date: formatDate(post.created_at),
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      likes: post.likes_count,
      comments: post.comments_count,
      isAnonymous: post.is_anonymous,
      isPrivate: post.is_private,
    })) || [];
  } catch (error) {
    console.error('Error getting following feed:', error);
    return [];
  }
}

// 날짜 포맷팅 헬퍼 함수
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