// User-related types and interfaces for Anxy blog platform

export interface User {
  id: string;
  username: string;        // @username (unique identifier)
  displayName: string;     // 표시되는 이름
  bio: string;            // 한 줄 소개
  avatar: string;         // 아바타 이미지 (기본값: "default")
  createdAt: string;      // 생성일
  isPrivate: boolean;     // 프로필 비공개 여부
  allowFollow: boolean;   // 팔로우 허용 여부
}

export interface CreateUserData {
  username: string;
  displayName: string;
  bio?: string;
  isPrivate?: boolean;
  allowFollow?: boolean;
}

export interface UpdateUserData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  isPrivate?: boolean;
  allowFollow?: boolean;
}

// 사용자 인증 관련
export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  password: string;
  displayName: string;
  bio?: string;
}

// 사용자 통계
export interface UserStats {
  postCount: number;
  followerCount: number;
  followingCount: number;
}

// localStorage 키 정의
export const USER_STORAGE_KEYS = {
  USERS: 'anxy_users',
  CURRENT_USER: 'anxy_current_user',
  USER_SESSIONS: 'anxy_user_sessions',
} as const;

// 기본값 정의
export const DEFAULT_USER_VALUES = {
  avatar: 'default',
  bio: '',
  isPrivate: false,
  allowFollow: true,
} as const;

export type UserStorageKey = keyof typeof USER_STORAGE_KEYS;