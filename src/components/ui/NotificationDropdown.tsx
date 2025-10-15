'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types/notification';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/utils/supabaseNotificationUtils';
import { getUserById } from '@/utils/supabaseUserUtils';

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  userId: string;
}

export default function NotificationDropdown({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  userId
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id, userId);
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'NEW_FOLLOWER' && notification.actorId) {
      // Get follower's username and navigate to their profile
      const follower = await getUserById(notification.actorId);
      if (follower) {
        router.push(`/u/${follower.username}`);
      }
      onClose();
    } else if (notification.type === 'POST_LIKE' && notification.postId) {
      router.push(`/post/${notification.postId}`);
      onClose();
    } else if (notification.type === 'COMMENT' && notification.postId) {
      router.push(`/post/${notification.postId}`);
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    onMarkAllAsRead();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}주 전`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}개월 전`;
    return `${Math.floor(seconds / 31536000)}년 전`;
  };

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 lg:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">알림</h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            모두 읽음 표시
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <svg
              className="w-12 h-12 text-gray-300 mb-3"
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
            <p className="text-sm text-gray-500">알림이 없습니다</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`
                w-full flex items-start gap-3 px-4 py-3 text-left
                transition-colors hover:bg-gray-50
                ${!notification.isRead ? 'bg-blue-50' : 'bg-white'}
                border-b border-gray-100 last:border-b-0
              `}
            >
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                    {notification.message}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {formatTimeAgo(notification.createdAt)}
                </p>
              </div>

              {/* Unread indicator */}
              {!notification.isRead && (
                <div className="flex-shrink-0 mt-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer - could be used for "View All" link in future */}
      {/* Uncomment when notifications page is implemented
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 text-center">
          <Link
            href="/notifications"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={onClose}
          >
            모든 알림 보기
          </Link>
        </div>
      )}
      */}
    </div>
  );
}
