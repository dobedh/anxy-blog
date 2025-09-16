'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  {
    name: 'Home',
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    )
  },
  {
    name: 'Library', 
    href: '/library',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    )
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated } = useAuth();

  return (
    <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 pt-16 z-40">
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-4 py-8 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={`mr-3 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
          
          {/* Profile link - only show when authenticated */}
          {isAuthenticated && currentUser && (
            <Link
              href={`/u/${currentUser.username}`}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === `/u/${currentUser.username}`
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`mr-3 ${pathname === `/u/${currentUser.username}` ? 'text-gray-900' : 'text-gray-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Profile
            </Link>
          )}
        </nav>

        {/* Bottom section with user info */}
        {isAuthenticated && currentUser && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {currentUser.displayName.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.displayName}
                </p>
                <p className="text-xs text-gray-500">
                  @{currentUser.username}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}