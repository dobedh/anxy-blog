'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isMenuOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="h-16 flex items-center justify-between">
        {/* Left Side - Hamburger, Logo, and Search */}
        <div className="flex items-center flex-1">
          {/* Hamburger Menu Button - Flush to left edge */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-16 px-6 hover:bg-gray-100 transition-colors flex items-center justify-center"
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
                {isAuthenticated ? (
                  <>
                    {/* Top Section - Profile + Write Button */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        {/* Profile Image */}
                        <Link
                          href={`/u/${currentUser?.username}`}
                          className="flex items-center space-x-3 flex-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="w-12 h-12 bg-brunch-light-green rounded-full">
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-900">
                              {currentUser?.displayName}
                            </p>
                          </div>
                        </Link>

                        {/* Write Button */}
                        <Link
                          href="/write"
                          className="ml-4 px-5 py-2 bg-white text-gray-600 border border-gray-400 rounded-full hover:bg-gray-50 hover:text-gray-700 hover:border-gray-500 transition-colors text-sm font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          글쓰기
                        </Link>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="py-4">
                      <nav className="space-y-1">
                        <Link
                          href="/"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          홈
                        </Link>
                        <Link
                          href={`/u/${currentUser?.username}`}
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          내 블로그
                        </Link>
                        <Link
                          href="/library"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                          라이브러리
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
                        className="text-xl font-medium text-gray-900"
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
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          홈
                        </Link>
                        <Link
                          href="/library"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                          라이브러리
                        </Link>

                        {/* Authentication Section */}
                        <div className="border-t border-gray-200 my-4"></div>
                        <Link
                          href="/login"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          로그인
                        </Link>
                        <Link
                          href="/signup"
                          className="flex items-center px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
                      className="w-full px-5 py-2 bg-white text-gray-500 rounded-full hover:bg-gray-50 hover:text-gray-600 transition-colors text-sm font-medium"
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
            className="text-xl font-medium text-gray-900 hover:text-gray-700 transition-colors"
          >
            Anxy
          </Link>

          {/* Search Bar - Left positioned */}
          <div className="flex-1 max-w-48 ml-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-100/30 rounded-full focus:outline-none focus:bg-gray-100/50 placeholder-gray-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
            </div>
          </div>
        </div>

        {/* Right Side - Write, Profile */}
        <div className="flex items-center gap-4 pr-6">
          {isAuthenticated ? (
            <>
              {/* Write Button */}
              <Link
                href="/write"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
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
                <span>글쓰기</span>
              </Link>

              {/* Profile Image */}
              <Link href={`/u/${currentUser?.username}`}>
                <div className="w-8 h-8 border border-gray-200 rounded-full focus:outline-none hover:bg-gray-100 transition-colors cursor-pointer">
                </div>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}