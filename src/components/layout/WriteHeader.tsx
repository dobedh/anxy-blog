'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface WriteHeaderProps {
  onSave: () => void;
  isSubmitting: boolean;
  isSaved?: boolean;
}

export default function WriteHeader({ onSave, isSubmitting, isSaved }: WriteHeaderProps) {
  const { currentUser } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white">
      <div className="h-16 flex items-center justify-center px-6 relative">
        {/* Left Side - Logo and Saved Status (moved towards center) */}
        <div className="absolute left-1/4 flex items-center gap-4">
          <Link
            href="/"
            className="text-xl font-medium text-gray-900 hover:text-gray-700 transition-colors"
          >
            Anxy
          </Link>
          {isSaved && (
            <span className="text-sm text-gray-400">Saved</span>
          )}
        </div>

        {/* Right Side - Save and Notification (moved towards center) */}
        <div className="absolute right-1/4 flex items-center gap-2">
          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-gray-700 text-sm font-medium border border-gray-300 rounded-full hover:text-gray-900 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>

          {/* Notification Bell */}
          <button
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
            aria-label="Notifications"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}