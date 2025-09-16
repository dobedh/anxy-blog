'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthUser, USER_STORAGE_KEYS } from '@/types/user';
import MigrationHandler from '@/components/MigrationHandler';

// User State 타입 정의
interface UserState {
  currentUser: AuthUser | null;
  users: Record<string, User>;
  isLoading: boolean;
  isInitialized: boolean;
}

// Action 타입 정의
type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: AuthUser | null }
  | { type: 'SET_USERS'; payload: Record<string, User> }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: { userId: string; updates: Partial<User> } }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'CLEAR_ALL' };

// Context 타입 정의
interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
  // 편의 함수들
  login: (user: AuthUser) => void;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  removeUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
  getUserByUsername: (username: string) => User | undefined;
  isCurrentUser: (userId: string) => boolean;
}

// 초기 상태
const initialState: UserState = {
  currentUser: null,
  users: {},
  isLoading: true,
  isInitialized: false,
};

// Reducer 함수
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'ADD_USER':
      return {
        ...state,
        users: { ...state.users, [action.payload.id]: action.payload }
      };
    
    case 'UPDATE_USER':
      const { userId, updates } = action.payload;
      if (!state.users[userId]) return state;
      
      return {
        ...state,
        users: {
          ...state.users,
          [userId]: { ...state.users[userId], ...updates }
        }
      };
    
    case 'REMOVE_USER':
      const newUsers = { ...state.users };
      delete newUsers[action.payload];
      return { ...state, users: newUsers };
    
    case 'CLEAR_ALL':
      return initialState;
    
    default:
      return state;
  }
}

// Context 생성
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider 컴포넌트
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // localStorage에서 데이터 로드
  useEffect(() => {
    const loadUserData = () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // 사용자 목록 로드
        const usersData = localStorage.getItem(USER_STORAGE_KEYS.USERS);
        const users = usersData ? JSON.parse(usersData) : {};
        dispatch({ type: 'SET_USERS', payload: users });

        // 현재 로그인 사용자 로드
        const currentUserData = localStorage.getItem(USER_STORAGE_KEYS.CURRENT_USER);
        const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
        dispatch({ type: 'SET_CURRENT_USER', payload: currentUser });

        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        console.error('Failed to load user data:', error);
        // 데이터 로드 실패 시 초기화
        localStorage.removeItem(USER_STORAGE_KEYS.USERS);
        localStorage.removeItem(USER_STORAGE_KEYS.CURRENT_USER);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUserData();
  }, []);

  // localStorage 동기화
  useEffect(() => {
    if (!state.isInitialized) return;

    try {
      localStorage.setItem(USER_STORAGE_KEYS.USERS, JSON.stringify(state.users));
    } catch (error) {
      console.error('Failed to save users to localStorage:', error);
    }
  }, [state.users, state.isInitialized]);

  useEffect(() => {
    if (!state.isInitialized) return;

    try {
      if (state.currentUser) {
        localStorage.setItem(USER_STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEYS.CURRENT_USER);
      }
    } catch (error) {
      console.error('Failed to save current user to localStorage:', error);
    }
  }, [state.currentUser, state.isInitialized]);

  // 편의 함수들
  const login = (user: AuthUser) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
  };

  const logout = () => {
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
  };

  const addUser = (user: User) => {
    dispatch({ type: 'ADD_USER', payload: user });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: { userId, updates } });
  };

  const removeUser = (userId: string) => {
    dispatch({ type: 'REMOVE_USER', payload: userId });
  };

  const getUserById = (userId: string): User | undefined => {
    return state.users[userId];
  };

  const getUserByUsername = (username: string): User | undefined => {
    return Object.values(state.users).find(user => user.username === username);
  };

  const isCurrentUser = (userId: string): boolean => {
    return state.currentUser?.id === userId;
  };

  const contextValue: UserContextType = {
    state,
    dispatch,
    login,
    logout,
    addUser,
    updateUser,
    removeUser,
    getUserById,
    getUserByUsername,
    isCurrentUser,
  };

  return (
    <UserContext.Provider value={contextValue}>
      <MigrationHandler>
        {children}
      </MigrationHandler>
    </UserContext.Provider>
  );
}

// Hook for using UserContext
export function useUserContext(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

export default UserContext;