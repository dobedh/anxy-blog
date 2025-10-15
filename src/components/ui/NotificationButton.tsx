'use client';

interface NotificationButtonProps {
  unreadCount: number;
  isOpen: boolean;
  onClick: () => void;
}

export default function NotificationButton({
  unreadCount,
  isOpen,
  onClick
}: NotificationButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm font-medium
        rounded-full transition-colors
        ${isOpen
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
        }
      `}
      aria-label="알림"
    >
      {/* Bell Icon with Red Dot */}
      <span className="relative inline-block">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge - Red Dot */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </span>
    </button>
  );
}
