/**
 * Supabase Notification Utilities for Anxy platform
 * Handles all notification CRUD operations and real-time subscriptions
 */

import { getSupabaseClient } from '@/lib/supabase';
import { Notification, CreateNotificationData, NotificationResponse } from '@/types/notification';
import { logger } from '@/lib/logger';

/**
 * Create a new notification
 */
export async function createNotification(
  data: CreateNotificationData
): Promise<NotificationResponse> {
  try {
    const supabase = getSupabaseClient();

    // Don't create notification if actor is the same as recipient
    if (data.actorId === data.userId) {
      console.warn('⚠️ NOTIFICATION SKIPPED: Self-notification prevented', {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type
      });
      return {
        success: false,
        error: 'Cannot notify self'
      };
    }

    // Validate required fields before database insert
    console.log('🔔 Creating notification:', {
      userId: data.userId,
      actorId: data.actorId,
      actorName: data.actorName,
      type: data.type,
      title: data.title
    });

    if (!data.actorName) {
      console.error('❌ NOTIFICATION VALIDATION FAILED: Missing actorName');
      return {
        success: false,
        error: 'Actor name is required'
      };
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.userId,
        actor_id: data.actorId,
        actor_name: data.actorName,
        actor_avatar_url: data.actorAvatarUrl || null,
        type: data.type,
        title: data.title,
        message: data.message || null,
        post_id: data.postId || null,
        comment_id: data.commentId || null
      })
      .select()
      .single();

    if (error) {
      // Enhanced error logging with full details
      console.error('❌ DATABASE INSERT FAILED:', {
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        insertData: {
          user_id: data.userId,
          actor_id: data.actorId,
          actor_name: data.actorName,
          type: data.type
        }
      });

      logger.error({
        context: 'createNotification',
        error,
        metadata: { type: data.type, userId: data.userId }
      });
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Notification created successfully:', notification.id);

    return {
      success: true,
      notification: transformNotification(notification)
    };
  } catch (error) {
    logger.error({
      context: 'createNotification',
      error,
      metadata: { type: data.type }
    });
    return {
      success: false,
      error: 'Failed to create notification'
    };
  }
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications(
  userId: string,
  offset: number = 0,
  limit: number = 20
): Promise<Notification[]> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error({
        context: 'getNotifications',
        error,
        metadata: { userId, offset, limit }
      });
      return [];
    }

    return (data || []).map(transformNotification);
  } catch (error) {
    logger.error({
      context: 'getNotifications',
      error,
      metadata: { userId }
    });
    return [];
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const supabase = getSupabaseClient();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      logger.error({
        context: 'getUnreadNotificationCount',
        error,
        metadata: { userId }
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error({
      context: 'getUnreadNotificationCount',
      error,
      metadata: { userId }
    });
    return 0;
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error({
        context: 'markNotificationAsRead',
        error,
        metadata: { notificationId, userId }
      });
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    logger.error({
      context: 'markNotificationAsRead',
      error,
      metadata: { notificationId }
    });
    return {
      success: false,
      error: 'Failed to mark notification as read'
    };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      logger.error({
        context: 'markAllNotificationsAsRead',
        error,
        metadata: { userId }
      });
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    logger.error({
      context: 'markAllNotificationsAsRead',
      error,
      metadata: { userId }
    });
    return {
      success: false,
      error: 'Failed to mark all notifications as read'
    };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error({
        context: 'deleteNotification',
        error,
        metadata: { notificationId, userId }
      });
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    logger.error({
      context: 'deleteNotification',
      error,
      metadata: { notificationId }
    });
    return {
      success: false,
      error: 'Failed to delete notification'
    };
  }
}

/**
 * Transform database notification to typed Notification object
 */
function transformNotification(dbNotification: any): Notification {
  return {
    id: dbNotification.id,
    userId: dbNotification.user_id,
    actorId: dbNotification.actor_id,
    actorName: dbNotification.actor_name,
    actorAvatarUrl: dbNotification.actor_avatar_url,
    type: dbNotification.type,
    title: dbNotification.title,
    message: dbNotification.message,
    postId: dbNotification.post_id,
    commentId: dbNotification.comment_id,
    isRead: dbNotification.is_read,
    readAt: dbNotification.read_at,
    createdAt: dbNotification.created_at
  };
}
