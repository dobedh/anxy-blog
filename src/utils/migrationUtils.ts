import { supabase } from '@/lib/supabase';

// 마이그레이션 결과 타입
export interface MigrationResult {
  success: boolean;
  postsCount: number;
  usersCount: number;
  errors: string[];
  details?: string;
}

// localStorage에서 기존 데이터 로드
function loadLocalStorageData() {
  try {
    const posts = JSON.parse(localStorage.getItem('userPosts') || '[]');
    const users = JSON.parse(localStorage.getItem('anxy_users') || '{}');
    const follows = JSON.parse(localStorage.getItem('anxy_follows') || '[]');

    return { posts, users, follows };
  } catch (error) {
    console.error('Error loading localStorage data:', error);
    return { posts: [], users: {}, follows: [] };
  }
}

// 기존 글 데이터를 Supabase 형식으로 변환
function convertLegacyPostToSupabase(legacyPost: Record<string, unknown>, authorMapping: Record<string, string>) {
  const authorId = authorMapping[legacyPost.author] || null;

  return {
    id: (legacyPost.id?.toString() as string) || `legacy_${Date.now()}_${Math.random()}`,
    title: (legacyPost.title as string) || '제목 없음',
    content: (legacyPost.content as string) || (legacyPost.excerpt as string) || '',
    excerpt: (legacyPost.excerpt as string) || '',
    author_id: legacyPost.author === '익명' ? null : authorId,
    author_name: (legacyPost.author as string) || '익명',
    category: (legacyPost.category as string) || '자유',
    is_anonymous: legacyPost.author === '익명',
    is_private: false,
    likes_count: (legacyPost.likes as number) || 0,
    comments_count: (legacyPost.comments as number) || 0,
    created_at: legacyPost.date ? new Date(legacyPost.date as string).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// 기존 사용자 데이터를 Supabase 형식으로 변환
function convertLegacyUserToSupabase(userId: string, legacyUser: any) {
  return {
    id: userId,
    username: legacyUser.username || `user_${userId.slice(0, 8)}`,
    bio: legacyUser.bio || '',
    avatar_url: legacyUser.avatar === 'default' ? null : legacyUser.avatar,
    is_private: legacyUser.isPrivate || false,
    allow_follow: legacyUser.allowFollow !== false,
    created_at: legacyUser.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// 데이터 마이그레이션 실행
export async function migrateLocalStorageToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    postsCount: 0,
    usersCount: 0,
    errors: []
  };

  try {
    // 1. 현재 사용자 확인
    const { data: { user: currentUser } } = await supabase().auth.getUser();
    if (!currentUser) {
      result.errors.push('로그인이 필요합니다.');
      return result;
    }

    // 2. localStorage 데이터 로드
    const { posts, users, follows } = loadLocalStorageData();

    if (posts.length === 0 && Object.keys(users).length === 0) {
      result.success = true;
      result.details = '마이그레이션할 데이터가 없습니다.';
      return result;
    }

    console.log('마이그레이션 시작:', {
      postsCount: posts.length,
      usersCount: Object.keys(users).length,
      followsCount: follows.length
    });

    // 3. 사용자 데이터 마이그레이션
    const authorMapping: Record<string, string> = {};

    // 현재 로그인한 사용자는 이미 존재하므로 매핑에 추가
    authorMapping[currentUser.email || 'current_user'] = currentUser.id;

    // 기존 사용자들을 새로운 임시 프로필로 생성 (실제로는 하지 않고 매핑만 생성)
    for (const [userId, userData] of Object.entries(users)) {
      const typedUserData = userData as any;
      if (typedUserData.username) {
        // 기존 사용자들은 현재 사용자로 통합 (MVP용)
        authorMapping[typedUserData.username] = currentUser.id;
        authorMapping[typedUserData.displayName] = currentUser.id;
      }
    }

    // 익명 글은 author_id가 null이 되도록 설정
    authorMapping['익명'] = 'anonymous';

    // 4. 글 데이터 마이그레이션
    let migratedPostsCount = 0;

    for (const legacyPost of posts) {
      try {
        const supabasePost = convertLegacyPostToSupabase(legacyPost, authorMapping);

        // 이미 존재하는지 확인
        const { data: existingPost } = await supabase()
          .from('posts')
          .select('id')
          .eq('id', supabasePost.id)
          .single();

        if (!existingPost) {
          const { error } = await supabase()
            .from('posts')
            .insert(supabasePost);

          if (error) {
            console.error('글 마이그레이션 오류:', error);
            result.errors.push(`글 "${legacyPost.title}" 마이그레이션 실패: ${error.message}`);
          } else {
            migratedPostsCount++;
          }
        }
      } catch (error) {
        console.error('글 처리 오류:', error);
        result.errors.push(`글 "${legacyPost.title}" 처리 중 오류 발생`);
      }
    }

    result.postsCount = migratedPostsCount;
    result.usersCount = 1; // 현재 사용자만 카운트

    // 5. 마이그레이션 완료 표시
    if (result.errors.length === 0 || migratedPostsCount > 0) {
      result.success = true;
      result.details = `총 ${migratedPostsCount}개의 글이 성공적으로 마이그레이션되었습니다.`;

      // 마이그레이션 완료 후 localStorage 백업 및 정리
      try {
        localStorage.setItem('anxy_migration_backup', JSON.stringify({
          posts,
          users,
          follows,
          migratedAt: new Date().toISOString()
        }));

        // 원본 데이터는 보존 (사용자가 직접 삭제할 수 있도록)
        localStorage.setItem('anxy_migration_completed', 'true');
      } catch (backupError) {
        console.error('백업 생성 오류:', backupError);
      }
    }

    return result;

  } catch (error) {
    console.error('마이그레이션 전체 오류:', error);
    result.errors.push(`마이그레이션 중 예상치 못한 오류가 발생했습니다: ${error}`);
    return result;
  }
}

// 마이그레이션 상태 확인
export function checkMigrationStatus(): {
  isCompleted: boolean;
  hasLocalData: boolean;
  localDataSummary: {
    postsCount: number;
    usersCount: number;
  };
} {
  try {
    const isCompleted = localStorage.getItem('anxy_migration_completed') === 'true';
    const { posts, users } = loadLocalStorageData();

    return {
      isCompleted,
      hasLocalData: posts.length > 0 || Object.keys(users).length > 0,
      localDataSummary: {
        postsCount: posts.length,
        usersCount: Object.keys(users).length
      }
    };
  } catch (error) {
    console.error('마이그레이션 상태 확인 오류:', error);
    return {
      isCompleted: false,
      hasLocalData: false,
      localDataSummary: {
        postsCount: 0,
        usersCount: 0
      }
    };
  }
}

// localStorage 데이터 삭제 (마이그레이션 완료 후)
export function cleanupLocalStorageData(): { success: boolean; error?: string } {
  try {
    const keysToRemove = [
      'userPosts',
      'anxy_users',
      'anxy_current_user',
      'anxy_follows',
      'anxy_user_sessions'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // 정리 완료 표시
    localStorage.setItem('anxy_localStorage_cleaned', 'true');

    return { success: true };
  } catch (error) {
    console.error('localStorage 정리 오류:', error);
    return {
      success: false,
      error: `localStorage 정리 중 오류가 발생했습니다: ${error}`
    };
  }
}

// 백업 데이터 복원
export function restoreFromBackup(): { success: boolean; error?: string } {
  try {
    const backupData = localStorage.getItem('anxy_migration_backup');

    if (!backupData) {
      return { success: false, error: '백업 데이터를 찾을 수 없습니다.' };
    }

    const { posts, users, follows } = JSON.parse(backupData);

    localStorage.setItem('userPosts', JSON.stringify(posts));
    localStorage.setItem('anxy_users', JSON.stringify(users));
    localStorage.setItem('anxy_follows', JSON.stringify(follows));

    // 마이그레이션 상태 리셋
    localStorage.removeItem('anxy_migration_completed');

    return { success: true };
  } catch (error) {
    console.error('백업 복원 오류:', error);
    return {
      success: false,
      error: `백업 복원 중 오류가 발생했습니다: ${error}`
    };
  }
}