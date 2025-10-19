'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useScrollEffect } from '@/hooks/useScrollEffect';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginModal from '@/components/ui/LoginModal';
import SignupModal from '@/components/ui/SignupModal';
import NotificationButton from '@/components/ui/NotificationButton';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';

export default function Header() {
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isScrolled = useScrollEffect(10);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Notification management
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(
    currentUser?.id
  );

  // 인증 상태 변경 시 메뉴 닫기 (혼동 방지)
  useEffect(() => {
    setIsMenuOpen(false);
  }, [isAuthenticated]);

  // URL 파라미터에서 검색어 초기화
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/');
    }
  };

  // 검색어 변경 처리
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 검색어 초기화
  const handleSearchClear = () => {
    setSearchTerm('');
    router.push('/');
  };


  // 메뉴 외부 클릭 핸들러 최적화
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  }, []);

  // ESC 키 핸들러 최적화
  const handleEsc = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false);
    }
  }, []);

  // 메뉴 열림/닫힘에 따른 이벤트 리스너 및 스크롤 잠금 관리
  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
      // CSS 클래스를 사용한 스크롤 잠금
      document.body.classList.add('body-scroll-lock');
    } else {
      document.body.classList.remove('body-scroll-lock');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
      // 컴포넌트 언마운트 시 스크롤 잠금 해제
      document.body.classList.remove('body-scroll-lock');
    };
  }, [isMenuOpen, handleClickOutside, handleEsc]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 header-transition header-transparent ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="h-16 flex items-center justify-between px-4 lg:px-6">
        {/* Left Side - Hamburger, Logo, and Search */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Hamburger Menu Button */}
          <div ref={dropdownRef} className="relative w-16 flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-16 px-3 lg:px-4 hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Mobile Sidebar Overlay */}
            {isMenuOpen && (
              <div className={`fixed inset-y-0 left-0 w-80 bg-white transform transition-all duration-400 ease-out shadow-2xl z-50 pb-20 ${
                isMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}>
                {isLoading ? (
                  <>
                    {/* Loading skeleton for sidebar */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                          <div>
                            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="ml-4 w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="py-4 space-y-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center px-6 py-3">
                          <div className="w-5 h-5 mr-3 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : isAuthenticated ? (
                  <>
                    {/* Top Section - Profile + Write Button */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        {/* Profile Image */}
                        <Link
                          href={`/u/${currentUser?.username}`}
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="w-12 h-12 bg-brunch-light-green rounded-full">
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-900">
                              {currentUser?.username}
                            </p>
                          </div>
                        </Link>

                        {/* Write Button */}
                        <Link
                          href="/write"
                          className="ml-4 p-2 bg-white text-gray-600 border border-gray-400 rounded-full hover:bg-gray-50 hover:text-gray-700 hover:border-gray-500 transition-colors cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                          title="글쓰기"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="py-4">
                      <nav className="space-y-1">
                        <Link
                          href="/"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          홈
                        </Link>
                        <Link
                          href={`/u/${currentUser?.username}`}
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          내 노트
                        </Link>
                        <Link
                          href="/likes"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          좋아요 한 글
                        </Link>
                      </nav>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest Header */}
                    <div className="p-6 border-b border-gray-200">
                      <Link
                        href="/"
                        className="text-xl font-medium text-gray-900 cursor-pointer"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Anxy
                      </Link>
                    </div>

                    {/* Navigation */}
                    <div className="py-4">
                      <nav className="space-y-1">
                        <Link
                          href="/"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          홈
                        </Link>

                        {/* Authentication Section */}
                        <div className="border-t border-gray-200 my-4"></div>
                        <button
                          className="w-full flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsLoginModalOpen(true);
                          }}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          로그인
                        </button>
                        <Link
                          href="/signup"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          회원가입
                        </Link>
                      </nav>
                    </div>
                  </>
                )}

                {/* Logout Section - Absolute Bottom */}
                {isAuthenticated && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-5 py-2 bg-white text-gray-500 rounded-full hover:bg-gray-50 hover:text-gray-600 transition-colors text-sm font-medium cursor-pointer"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Logo - Right next to hamburger */}
          <Link
            href="/"
            className="text-xl font-medium text-gray-900 hover:text-gray-700 transition-colors flex-shrink-0 px-3 whitespace-nowrap cursor-pointer"
          >
            Anxy
          </Link>

          {/* Search Bar - Responsive positioned */}
          <div className="flex-1 min-w-0 max-w-sm mx-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-8 lg:pl-10 pr-8 lg:pr-10 py-1.5 lg:py-2 text-sm text-gray-700 bg-gray-100/30 rounded-full focus:outline-none focus:bg-gray-100/50 placeholder-gray-500"
              />
              <svg
                className="absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Right Side - Write, Notification, Profile */}
        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0 min-w-0 mr-2 lg:mr-4">
          {isLoading ? (
            // Loading skeleton - 동일한 크기 유지
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="hidden lg:block w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="hidden lg:block w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 border border-gray-200 rounded-full animate-pulse flex-shrink-0">
              </div>
            </>
          ) : isAuthenticated ? (
            <>
              {/* Write Button */}
              <Link
                href="/write"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                title="글쓰기"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span className="hidden lg:inline">글쓰기</span>
              </Link>

              {/* Notification Button */}
              <div className="relative">
                <NotificationButton
                  unreadCount={unreadCount}
                  isOpen={isNotificationOpen}
                  onClick={() => {
                    const willBeOpen = !isNotificationOpen;
                    setIsNotificationOpen(willBeOpen);

                    // 드롭다운이 열릴 때 모든 알림을 읽음 처리
                    if (willBeOpen && unreadCount > 0) {
                      markAllAsRead();
                    }
                  }}
                />

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setIsNotificationOpen(false)}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    userId={currentUser!.id}
                  />
                )}
              </div>

              {/* Profile Image */}
              <Link href={`/u/${currentUser?.username}`} className="flex-shrink-0 cursor-pointer">
                <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-full focus:outline-none hover:bg-gray-200 transition-colors cursor-pointer">
                </div>
              </Link>
            </>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 cursor-pointer"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </>
  );
}