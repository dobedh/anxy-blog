import { 
  User, 
  CreateUserData, 
  UpdateUserData, 
  AuthUser, 
  LoginCredentials, 
  SignupData, 
  UserStats,
  USER_STORAGE_KEYS,
  DEFAULT_USER_VALUES 
} from '@/types/user';

// 간단한 해시 함수 (실제 운영환경에서는 더 강력한 해시 사용)
function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer로 변환
  }
  
  return Math.abs(hash).toString(36);
}

// 고유 ID 생성 함수
function generateUserId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2);
  return `user_${timestamp}_${randomStr}`;
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


// localStorage에서 사용자 데이터 로드
export function loadUsers(): Record<string, User> {
  try {
    const usersData = localStorage.getItem(USER_STORAGE_KEYS.USERS);
    return usersData ? JSON.parse(usersData) : {};
  } catch (error) {
    console.error('Failed to load users:', error);
    return {};
  }
}

// localStorage에 사용자 데이터 저장
export function saveUsers(users: Record<string, User>): void {
  try {
    localStorage.setItem(USER_STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users:', error);
    throw new Error('사용자 데이터 저장에 실패했습니다.');
  }
}

// 닉네임 중복 체크
export function checkUsernameAvailability(username: string): boolean {
  const users = loadUsers();
  return !Object.values(users).some(user => user.username === username);
}

// 새 사용자 생성
export function createUser(data: CreateUserData): { success: boolean; user?: User; error?: string } {
  try {
    // 유효성 검사
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.isValid) {
      return { success: false, error: usernameValidation.error };
    }
    
    // 중복 체크
    if (!checkUsernameAvailability(data.username)) {
      return { success: false, error: '이미 사용 중인 닉네임입니다.' };
    }
    
    // 새 사용자 객체 생성
    const newUser: User = {
      id: generateUserId(),
      username: data.username,
      bio: data.bio || DEFAULT_USER_VALUES.bio,
      avatar: DEFAULT_USER_VALUES.avatar,
      createdAt: new Date().toISOString(),
      isPrivate: data.isPrivate ?? DEFAULT_USER_VALUES.isPrivate,
      allowFollow: data.allowFollow ?? DEFAULT_USER_VALUES.allowFollow,
    };
    
    // 저장
    const users = loadUsers();
    users[newUser.id] = newUser;
    saveUsers(users);
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: '사용자 생성 중 오류가 발생했습니다.' };
  }
}

// 사용자 정보 업데이트
export function updateUser(userId: string, updates: UpdateUserData): { success: boolean; user?: User; error?: string } {
  try {
    const users = loadUsers();
    const user = users[userId];
    
    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    
    // 업데이트
    const updatedUser: User = { ...user, ...updates };
    users[userId] = updatedUser;
    saveUsers(users);
    
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
}

// 사용자 삭제
export function deleteUser(userId: string): { success: boolean; error?: string } {
  try {
    const users = loadUsers();
    
    if (!users[userId]) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    delete users[userId];
    saveUsers(users);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: '사용자 삭제 중 오류가 발생했습니다.' };
  }
}

// 사용자 로그인 (간단한 닉네임 기반)
export function loginUser(credentials: LoginCredentials): { success: boolean; user?: AuthUser; error?: string } {
  try {
    const users = loadUsers();
    const user = Object.values(users).find(u => u.username === credentials.username);
    
    if (!user) {
      return { success: false, error: '존재하지 않는 닉네임입니다.' };
    }
    
    // 간단한 비밀번호 검증 (실제로는 해시된 비밀번호와 비교)
    const passwordHash = simpleHash(credentials.password);
    const storedPasswordHash = localStorage.getItem(`${USER_STORAGE_KEYS.USER_SESSIONS}_${user.id}_password`);
    
    if (!storedPasswordHash || storedPasswordHash !== passwordHash) {
      return { success: false, error: '비밀번호가 올바르지 않습니다.' };
    }
    
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
    };
    
    return { success: true, user: authUser };
  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
}

// 사용자 회원가입
export function signupUser(data: SignupData): { success: boolean; user?: AuthUser; error?: string } {
  try {
    // 사용자 생성
    const createResult = createUser({
      username: data.username,
      bio: data.bio,
    });
    
    if (!createResult.success) {
      return { success: false, error: createResult.error };
    }
    
    const user = createResult.user!;
    
    // 비밀번호 해시 저장 (간단한 해시)
    const passwordHash = simpleHash(data.password);
    localStorage.setItem(`${USER_STORAGE_KEYS.USER_SESSIONS}_${user.id}_password`, passwordHash);
    
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
    };
    
    return { success: true, user: authUser };
  } catch (error) {
    console.error('Error during signup:', error);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
}

// 사용자 통계 계산
export function getUserStats(userId: string): UserStats {
  try {
    // 글 수 계산 (추후 구현된 글 시스템과 연동)
    const posts = JSON.parse(localStorage.getItem('userPosts') || '[]');
    const userPosts = posts.filter((post: any) => post.authorId === userId);
    
    return {
      postCount: userPosts.length,
      followerCount: 0, // 추후 팔로우 시스템과 연동
      followingCount: 0, // 추후 팔로우 시스템과 연동
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

// ID로 사용자 조회
export function getUserById(userId: string): User | undefined {
  const users = loadUsers();
  return users[userId];
}

// 닉네임으로 사용자 조회
export function getUserByUsername(username: string): User | undefined {
  const users = loadUsers();
  return Object.values(users).find(user => user.username === username);
}

// 현재 로그인 사용자 정보 로드
export function getCurrentUser(): AuthUser | null {
  try {
    const currentUserData = localStorage.getItem(USER_STORAGE_KEYS.CURRENT_USER);
    return currentUserData ? JSON.parse(currentUserData) : null;
  } catch (error) {
    console.error('Failed to load current user:', error);
    return null;
  }
}

// 로그아웃
export function logoutUser(): void {
  localStorage.removeItem(USER_STORAGE_KEYS.CURRENT_USER);
}