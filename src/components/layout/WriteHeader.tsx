'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useScrollEffect } from '@/hooks/useScrollEffect';

interface WriteHeaderProps {
  onSave: () => void;
  isSubmitting: boolean;
  isSaved?: boolean;
}

export default function WriteHeader({ onSave, isSubmitting, isSaved }: WriteHeaderProps) {
  const { currentUser } = useAuth();
  const isScrolled = useScrollEffect(10);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 header-transition ${isScrolled ? 'header-transparent header-scrolled' : 'bg-white'}`}>
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

        {/* Right Side - Save Button (moved towards center) */}
        <div className="absolute right-1/4 flex items-center gap-2">
          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-gray-600 text-sm font-medium border border-gray-400 rounded-full hover:text-gray-700 hover:border-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </header>
  );
}