// 데이터 마이그레이션 유틸리티
import { migratePostData } from './postUtils';
import { createUser } from './userUtils';
import { User, DEFAULT_USER_VALUES } from '@/types/user';
import { Post } from '@/types/post';

// 마이그레이션 버전 관리
const MIGRATION_VERSION_KEY = 'anxy_migration_version';
const CURRENT_MIGRATION_VERSION = '1.0.0';

// 마이그레이션 결과 타입
interface MigrationResult {
  success: boolean;
  version: string;
  changes: {
    usersCreated: number;
    postsUpdated: number;
    mockDataCreated: boolean;
  };
  errors: string[];
}

// 기본 목업 사용자들 생성
const MOCK_USERS = [
  {
    username: 'mindful_writer',
    displayName: '마음챙김',
    bio: '불안한 마음을 글로 다스려가는 중입니다',
  },
  {
    username: 'warm_heart',
    displayName: '따뜻한마음',
    bio: '서로에게 힘이 되는 말을 나누고 싶어요',
  },
  {
    username: 'book_lover',
    displayName: '책벌레',
    bio: '책을 통해 위로받고 나누고 싶습니다',
  },
  {
    username: 'walking_person',
    displayName: '걷는사람',
    bio: '산책하며 찾은 작은 행복을 기록합니다',
  },
  {
    username: 'music_friend',
    displayName: '음악친구',
    bio: '음악으로 마음을 달래고 공유하는 것을 좋아해요',
  },
];

// 목업 사용자 생성
function createMockUsers(): { success: boolean; usersCreated: number; errors: string[] } {
  const results = {
    success: true,
    usersCreated: 0,
    errors: [] as string[],
  };

  try {
    // 기존 사용자들 확인
    const existingUsers = JSON.parse(localStorage.getItem('anxy_users') || '{}');
    
    for (const mockUser of MOCK_USERS) {
      // 이미 존재하는 사용자명인지 체크
      const userExists = Object.values(existingUsers).some((user: any) => 
        user.username === mockUser.username
      );
      
      if (!userExists) {
        const result = createUser({
          username: mockUser.username,
          displayName: mockUser.displayName,
          bio: mockUser.bio,
          isPrivate: false,
          allowFollow: true,
        });
        
        if (result.success) {
          results.usersCreated++;
          
          // 목업 사용자용 간단한 패스워드 설정
          const userId = result.user!.id;
          const simplePassword = `password${results.usersCreated}`;
          const passwordHash = simpleHash(simplePassword);
          localStorage.setItem(`anxy_user_sessions_${userId}_password`, passwordHash);
        } else {
          results.errors.push(`Failed to create user ${mockUser.username}: ${result.error}`);
        }
      }
    }
  } catch (error) {
    results.success = false;
    results.errors.push(`Error creating mock users: ${error}`);
  }

  return results;
}

// 간단한 해시 함수 (userUtils와 동일)
function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// 기존 글들을 목업 사용자들에게 할당
function assignPostsToMockUsers(): { success: boolean; postsUpdated: number; errors: string[] } {
  const results = {
    success: true,
    postsUpdated: 0,
    errors: [] as string[],
  };

  try {
    // 글 목록 로드
    const postsData = localStorage.getItem('anxy_posts');
    if (!postsData) return results;
    
    const posts: Post[] = JSON.parse(postsData);
    const users = JSON.parse(localStorage.getItem('anxy_users') || '{}');
    const userList = Object.values(users) as User[];
    
    // authorId가 없는 글들을 찾아서 목업 사용자에게 할당
    const updatedPosts = posts.map(post => {
      if (!post.authorId && !post.isAnonymous) {
        // 작성자명으로 사용자 매칭 시도
        let assignedUser = userList.find(user => user.displayName === post.author);
        
        // 매칭되는 사용자가 없으면 랜덤하게 할당
        if (!assignedUser) {
          const randomIndex = Math.floor(Math.random() * userList.length);
          assignedUser = userList[randomIndex];
        }
        
        if (assignedUser) {
          post.authorId = assignedUser.id;
          post.authorName = assignedUser.displayName;
          post.author = assignedUser.displayName;
          results.postsUpdated++;
        }
      }
      
      return post;
    });
    
    // 업데이트된 글 목록 저장
    localStorage.setItem('anxy_posts', JSON.stringify(updatedPosts));
  } catch (error) {
    results.success = false;
    results.errors.push(`Error assigning posts to users: ${error}`);
  }

  return results;
}

// 현재 마이그레이션 버전 확인
function getCurrentMigrationVersion(): string {
  return localStorage.getItem(MIGRATION_VERSION_KEY) || '0.0.0';
}

// 마이그레이션 버전 업데이트
function setMigrationVersion(version: string): void {
  localStorage.setItem(MIGRATION_VERSION_KEY, version);
}

// 마이그레이션 필요 여부 체크
export function needsMigration(): boolean {
  const currentVersion = getCurrentMigrationVersion();
  return currentVersion !== CURRENT_MIGRATION_VERSION;
}

// 전체 마이그레이션 실행
export async function runMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    version: CURRENT_MIGRATION_VERSION,
    changes: {
      usersCreated: 0,
      postsUpdated: 0,
      mockDataCreated: false,
    },
    errors: [],
  };

  try {
    console.log('🔄 Starting data migration...');
    
    // 1. 글 데이터 마이그레이션
    const postMigration = migratePostData();
    if (!postMigration.success) {
      result.success = false;
      result.errors.push('Failed to migrate post data');
    } else {
      result.changes.postsUpdated += postMigration.migratedCount;
      if (postMigration.migratedCount > 0) {
        console.log(`✅ Migrated ${postMigration.migratedCount} posts to new format`);
      }
    }
    
    // 2. 목업 사용자 생성
    const userCreation = createMockUsers();
    result.changes.usersCreated = userCreation.usersCreated;
    if (!userCreation.success) {
      result.errors.push(...userCreation.errors);
    } else if (userCreation.usersCreated > 0) {
      console.log(`✅ Created ${userCreation.usersCreated} mock users`);
      result.changes.mockDataCreated = true;
    }
    
    // 3. 글을 사용자에게 할당
    const postAssignment = assignPostsToMockUsers();
    result.changes.postsUpdated += postAssignment.postsUpdated;
    if (!postAssignment.success) {
      result.errors.push(...postAssignment.errors);
    } else if (postAssignment.postsUpdated > 0) {
      console.log(`✅ Assigned ${postAssignment.postsUpdated} posts to users`);
    }
    
    // 4. 마이그레이션 버전 업데이트
    setMigrationVersion(CURRENT_MIGRATION_VERSION);
    
    if (result.errors.length === 0) {
      console.log('✅ Migration completed successfully');
    } else {
      console.warn('⚠️ Migration completed with warnings:', result.errors);
    }
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error('❌ Migration failed:', error);
  }

  return result;
}

// 마이그레이션 초기화 (개발용)
export function resetMigration(): void {
  localStorage.removeItem(MIGRATION_VERSION_KEY);
  localStorage.removeItem('anxy_users');
  localStorage.removeItem('anxy_posts');
  localStorage.removeItem('anxy_current_user');
  console.log('🔄 Migration data reset');
}