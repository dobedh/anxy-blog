import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/supabase';
import { User, CreateUserData, UpdateUserData, UserStats } from '@/types/user';

// Supabase Profile을 User 타입으로 변환
export function convertProfileToUser(profile: Profile): User {
  return {
    id: profile.id,
    username: profile.username,
    bio: profile.bio || '',
    avatar: profile.avatar_url || 'default',
    createdAt: profile.created_at,
    isPrivate: profile.is_private,
    allowFollow: profile.allow_follow,
  };
}

// 닉네임 유효성 검사
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username) {
    return { isValid: false, error: '닉네임을 입력해주세요.' };
  }

  if (username.length < 2) {
    return { isValid: false, error: '닉네임은 2자 이상이어야 합니다.' };
  }

  if (username.length > 20) {
    return { isValid: false, error: '닉네임은 20자 이하여야 합니다.' };
  }

  if (!/^[a-zA-Z0-9_가-힣]+$/.test(username)) {
    return { isValid: false, error: '닉네임은 영문, 숫자, 언더스코어, 한글만 사용 가능합니다.' };
  }

  return { isValid: true };
}


// 닉네임 중복 체크
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase()
      .from('profiles')
      .select('username')
      .eq('username', username);

    if (error) {
      console.error('Error checking username:', error);
      return false;
    }

    // 빈 배열 = 사용 가능, 데이터 있음 = 사용 불가
    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

// 새 사용자 생성 (Supabase Auth에서 호출됨)
export async function createUser(data: CreateUserData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // 유효성 검사
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.isValid) {
      return { success: false, error: usernameValidation.error };
    }


    // 중복 체크
    const isAvailable = await checkUsernameAvailability(data.username);
    if (!isAvailable) {
      return { success: false, error: '이미 사용 중인 닉네임입니다.' };
    }

    // 현재 사용자 확인
    const { data: { user: currentUser } } = await supabase().auth.getUser();
    if (!currentUser) {
      return { success: false, error: '인증되지 않은 사용자입니다.' };
    }

    // 프로필 생성
    const { data: profile, error } = await supabase()
      .from('profiles')
      .insert({
        id: currentUser.id,
        username: data.username,
        bio: data.bio || '',
        is_private: data.isPrivate ?? false,
        allow_follow: data.allowFollow ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return { success: false, error: '프로필 생성에 실패했습니다.' };
    }

    return { success: true, user: convertProfileToUser(profile) };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: '사용자 생성 중 오류가 발생했습니다.' };
  }
}

// 사용자 정보 업데이트
export async function updateUser(userId: string, updates: UpdateUserData): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // 닉네임 유효성 검사 및 중복 체크 (업데이트 시에만)
    if (updates.username) {
      const usernameValidation = validateUsername(updates.username);
      if (!usernameValidation.isValid) {
        return { success: false, error: usernameValidation.error };
      }

      // 현재 사용자의 기존 username 확인
      const { data: currentProfile } = await supabase()
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle();

      // 닉네임이 실제로 변경되는 경우에만 중복 체크
      if (currentProfile && updates.username !== currentProfile.username) {
        const isAvailable = await checkUsernameAvailability(updates.username);
        if (!isAvailable) {
          return { success: false, error: '이미 사용 중인 닉네임입니다.' };
        }
      }
    }


    // 업데이트 데이터 준비
    const updateData: any = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatar) updateData.avatar_url = updates.avatar;
    if (updates.isPrivate !== undefined) updateData.is_private = updates.isPrivate;
    if (updates.allowFollow !== undefined) updateData.allow_follow = updates.allowFollow;

    updateData.updated_at = new Date().toISOString();

    // 업데이트 실행
    const { data: profile, error } = await supabase()
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: '프로필 업데이트에 실패했습니다.' };
    }

    return { success: true, user: convertProfileToUser(profile) };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
}

// 사용자 삭제
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase()
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting profile:', error);
      return { success: false, error: '프로필 삭제에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: '사용자 삭제 중 오류가 발생했습니다.' };
  }
}

// ID로 사용자 조회
export async function getUserById(userId: string): Promise<User | undefined> {
  try {
    console.log('🔍 Fetching user by ID:', userId);

    const { data: profile, error } = await supabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching user by ID:', {
        userId,
        error: error.message,
        code: error.code
      });
      return undefined;
    }

    if (!profile) {
      console.warn('⚠️ User profile not found for ID:', userId);
      return undefined;
    }

    // Validate critical fields
    if (!profile.username) {
      console.error('❌ CRITICAL: User profile has no username:', {
        userId: profile.id,
        profileData: profile
      });
      return undefined;
    }

    console.log('✅ User fetched successfully:', {
      userId: profile.id,
      username: profile.username
    });

    return convertProfileToUser(profile);
  } catch (error) {
    console.error('❌ Unexpected error getting user by ID:', {
      userId,
      error
    });
    return undefined;
  }
}

// 닉네임으로 사용자 조회
export async function getUserByUsername(username: string): Promise<User | undefined> {
  try {
    const { data: profile, error } = await supabase()
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }

    if (!profile) {
      return undefined;
    }

    return convertProfileToUser(profile);
  } catch (error) {
    console.error('Error getting user by username:', error);
    return undefined;
  }
}

// 사용자 통계 계산
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // 병렬로 통계 쿼리 실행
    const [postsResult, followersResult, followingResult] = await Promise.all([
      // 글 수
      supabase()
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('author_id', userId)
        .eq('is_private', false),

      // 팔로워 수
      supabase()
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('following_id', userId),

      // 팔로잉 수
      supabase()
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('follower_id', userId)
    ]);

    return {
      postCount: postsResult.count || 0,
      followerCount: followersResult.count || 0,
      followingCount: followingResult.count || 0,
    };
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return {
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
    };
  }
}

// 사용자 목록 조회 (페이지네이션 지원)
export async function getUsers(
  offset: number = 0,
  limit: number = 20,
  searchTerm?: string
): Promise<{ users: User[]; total: number }> {
  try {
    let query = supabase()
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`username.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
    }

    const { data: profiles, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return { users: [], total: 0 };
    }

    const users = profiles?.map(convertProfileToUser) || [];

    return {
      users,
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting users:', error);
    return { users: [], total: 0 };
  }
}

// 현재 로그인한 사용자 정보 조회
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase().auth.getUser();

    if (!user) {
      return null;
    }

    return await getUserById(user.id);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// 이메일 형식 확인 함수
export function isEmailFormat(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
}

// 닉네임 존재 여부 확인 (로그인용)
export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase()
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error checking username exists:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking username exists:', error);
    return false;
  }
}