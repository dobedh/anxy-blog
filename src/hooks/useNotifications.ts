/**
 * useNotifications Hook
 * Manages notification state and real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types/notification';
import {
  getNotifications,
  getUnreadNotificationCount
} from '@/utils/supabaseNotificationUtils';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [notifs, count] = await Promise.all([
        getNotifications(userId, 0, 10),
        getUnreadNotificationCount(userId)
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      logger.error({
        context: 'useNotifications.loadNotifications',
        error,
        metadata: { userId }
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load notifications on mount and when userId changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.debug({
            context: 'useNotifications.realtimeInsert',
            metadata: { notificationId: payload.new.id }
          });

          // Add new notification to the list
          const newNotification: Notification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            actorId: payload.new.actor_id,
            actorName: payload.new.actor_name,
            actorAvatarUrl: payload.new.actor_avatar_url,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            postId: payload.new.post_id,
            commentId: payload.new.comment_id,
            isRead: payload.new.is_read,
            readAt: payload.new.read_at,
            createdAt: payload.new.created_at
          };

          setNotifications((prev) => [newNotification, ...prev].slice(0, 10));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.debug({
            context: 'useNotifications.realtimeUpdate',
            metadata: { notificationId: payload.new.id }
          });

          // Update notification in the list
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === payload.new.id
                ? {
                    ...n,
                    isRead: payload.new.is_read,
                    readAt: payload.new.read_at
                  }
                : n
            )
          );

          // Update unread count if notification was marked as read
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  };
}
