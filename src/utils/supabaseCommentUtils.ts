/**
 * Supabase Comment Utilities for Anxy platform
 * Handles all comment CRUD operations with notification integration
 */

import { supabase } from '@/lib/supabase';
import { Comment, CreateCommentData } from '@/types/comment';
import { getUserById } from './supabaseUserUtils';
import { getPostById } from './supabasePostUtils';
import { createNotification } from './supabaseNotificationUtils';
import { logger } from '@/lib/logger';

/**
 * Create a new comment
 */
export async function createComment(
  data: CreateCommentData,
  authorId: string,
  authorName: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  try {
    // Validation
    if (!data.content.trim()) {
      return { success: false, error: '댓글 내용을 입력해주세요.' };
    }

    if (data.content.length > 500) {
      return { success: false, error: '댓글은 500자 이내로 작성해주세요.' };
    }

    // Create comment in database
    const { data: newComment, error } = await supabase()
      .from('comments')
      .insert({
        post_id: data.postId,
        author_id: authorId,
        author_name: authorName,
        content: data.content.trim()
      })
      .select()
      .single();

    if (error) {
      logger.error({
        context: 'createComment',
        error,
        metadata: { postId: data.postId, authorId }
      });
      return { success: false, error: '댓글 작성에 실패했습니다.' };
    }

    // Create notification (async, don't fail comment creation if notification fails)
    try {
      // Get post information
      const post = await getPostById(data.postId);

      // Only create notification if commenter is not the post author
      if (post && post.authorId && post.authorId !== authorId) {
        const commenterUser = await getUserById(authorId);

        if (commenterUser) {
          await createNotification({
            userId: post.authorId,
            actorId: authorId,
            actorName: commenterUser.username,
            actorAvatarUrl: commenterUser.avatar || null,
            type: 'COMMENT',
            title: `${commenterUser.username}님이 댓글을 남겼습니다`,
            message: data.content.length > 50
              ? data.content.substring(0, 50) + '...'
              : data.content,
            postId: data.postId,
            commentId: newComment.id
          });
        }
      }
    } catch (notifError) {
      // Log but don't fail comment creation
      logger.error({
        context: 'createComment.notification',
        error: notifError,
        metadata: { commentId: newComment.id }
      });
    }

    return {
      success: true,
      comment: transformComment(newComment)
    };
  } catch (error) {
    logger.error({
      context: 'createComment',
      error,
      metadata: { postId: data.postId }
    });
    return { success: false, error: '댓글 작성 중 오류가 발생했습니다.' };
  }
}

/**
 * Get comments for a specific post
 */
export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase()
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error({
        context: 'getCommentsByPostId',
        error,
        metadata: { postId }
      });
      return [];
    }

    return (data || []).map(transformComment);
  } catch (error) {
    logger.error({
      context: 'getCommentsByPostId',
      error,
      metadata: { postId }
    });
    return [];
  }
}

/**
 * Get comment count for a post
 */
export async function getCommentCount(postId: string): Promise<number> {
  try {
    const { count, error } = await supabase()
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      logger.error({
        context: 'getCommentCount',
        error,
        metadata: { postId }
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error({
      context: 'getCommentCount',
      error,
      metadata: { postId }
    });
    return 0;
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check ownership
    const { data: comment, error: fetchError } = await supabase()
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchError) {
      logger.error({
        context: 'deleteComment.fetch',
        error: fetchError,
        metadata: { commentId }
      });
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }

    if (!comment) {
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }

    if (comment.author_id !== userId) {
      return { success: false, error: '본인의 댓글만 삭제할 수 있습니다.' };
    }

    // Delete comment
    const { error } = await supabase()
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      logger.error({
        context: 'deleteComment',
        error,
        metadata: { commentId }
      });
      return { success: false, error: '댓글 삭제에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    logger.error({
      context: 'deleteComment',
      error,
      metadata: { commentId }
    });
    return { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * Edit a comment
 */
export async function editComment(
  commentId: string,
  newContent: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validation
    if (!newContent.trim()) {
      return { success: false, error: '댓글 내용을 입력해주세요.' };
    }

    if (newContent.length > 500) {
      return { success: false, error: '댓글은 500자 이내로 작성해주세요.' };
    }

    // Check ownership
    const { data: comment, error: fetchError } = await supabase()
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchError) {
      logger.error({
        context: 'editComment.fetch',
        error: fetchError,
        metadata: { commentId }
      });
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }

    if (!comment) {
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }

    if (comment.author_id !== userId) {
      return { success: false, error: '본인의 댓글만 수정할 수 있습니다.' };
    }

    // Update comment
    const { error } = await supabase()
      .from('comments')
      .update({
        content: newContent.trim(),
        updated_at: new Date().toISOString(),
        is_edited: true
      })
      .eq('id', commentId);

    if (error) {
      logger.error({
        context: 'editComment',
        error,
        metadata: { commentId }
      });
      return { success: false, error: '댓글 수정에 실패했습니다.' };
    }

    return { success: true };
  } catch (error) {
    logger.error({
      context: 'editComment',
      error,
      metadata: { commentId }
    });
    return { success: false, error: '댓글 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * Format comment date for display
 */
export function formatCommentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return '방금 전';
  } else if (minutes < 60) {
    return `${minutes}분 전`;
  } else if (hours < 24) {
    return `${hours}시간 전`;
  } else if (days < 7) {
    return `${days}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * Transform database comment to Comment type
 */
function transformComment(dbComment: any): Comment {
  return {
    id: dbComment.id,
    postId: dbComment.post_id,
    authorId: dbComment.author_id,
    authorName: dbComment.author_name,
    content: dbComment.content,
    createdAt: dbComment.created_at,
    updatedAt: dbComment.updated_at,
    isEdited: dbComment.is_edited || false
  };
}
