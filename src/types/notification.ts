/**
 * Notification types for Anxy platform
 * Defines notification data structures and type enums
 */

export type NotificationType =
  | 'NEW_FOLLOWER'
  | 'POST_LIKE'
  | 'COMMENT'
  | 'COMMENT_LIKE'
  | 'MENTION';

export interface Notification {
  id: string;
  userId: string;
  actorId: string | null;
  actorName: string;
  actorAvatarUrl: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  postId: string | null;
  commentId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationData {
  userId: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl?: string | null;
  type: NotificationType;
  title: string;
  message?: string;
  postId?: string | null;
  commentId?: string | null;
}

export interface NotificationResponse {
  success: boolean;
  error?: string;
  notification?: Notification;
}
