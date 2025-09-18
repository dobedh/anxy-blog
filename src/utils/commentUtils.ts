import { Comment, CreateCommentData, COMMENT_STORAGE_KEYS } from '@/types/comment';

export function loadComments(): Comment[] {
  try {
    const stored = localStorage.getItem(COMMENT_STORAGE_KEYS.COMMENTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}

export function saveComments(comments: Comment[]): void {
  try {
    localStorage.setItem(COMMENT_STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  } catch (error) {
    console.error('Error saving comments:', error);
  }
}

export function createComment(data: CreateCommentData, authorId: string, authorName: string): { success: boolean; comment?: Comment; error?: string } {
  try {
    if (!data.content.trim()) {
      return { success: false, error: '댓글 내용을 입력해주세요.' };
    }

    if (data.content.length > 500) {
      return { success: false, error: '댓글은 500자 이내로 작성해주세요.' };
    }

    const comments = loadComments();
    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: data.postId,
      authorId,
      authorName,
      content: data.content.trim(),
      createdAt: new Date().toISOString(),
      isEdited: false,
    };

    comments.push(newComment);
    saveComments(comments);

    return { success: true, comment: newComment };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { success: false, error: '댓글 작성 중 오류가 발생했습니다.' };
  }
}

export function getCommentsByPostId(postId: string): Comment[] {
  const comments = loadComments();
  return comments
    .filter(comment => comment.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getCommentCount(postId: string): number {
  return getCommentsByPostId(postId).length;
}

export function deleteComment(commentId: string, userId: string): { success: boolean; error?: string } {
  try {
    const comments = loadComments();
    const commentIndex = comments.findIndex(comment => comment.id === commentId);

    if (commentIndex === -1) {
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }

    const comment = comments[commentIndex];
    if (comment.authorId !== userId) {
      return { success: false, error: '본인의 댓글만 삭제할 수 있습니다.' };
    }

    comments.splice(commentIndex, 1);
    saveComments(comments);

    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: '댓글 삭제 중 오류가 발생했습니다.' };
  }
}

export function editComment(commentId: string, newContent: string, userId: string): { success: boolean; error?: string } {
  try {
    if (!newContent.trim()) {
      return { success: false, error: '댓글 내용을 입력해주세요.' };
    }

    if (newContent.length > 500) {
      return { success: false, error: '댓글은 500자 이내로 작성해주세요.' };
    }

    const comments = loadComments();
    const comment = comments.find(comment => comment.id === commentId);

    if (!comment) {
      return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }

    if (comment.authorId !== userId) {
      return { success: false, error: '본인의 댓글만 수정할 수 있습니다.' };
    }

    comment.content = newContent.trim();
    comment.updatedAt = new Date().toISOString();
    comment.isEdited = true;

    saveComments(comments);

    return { success: true };
  } catch (error) {
    console.error('Error editing comment:', error);
    return { success: false, error: '댓글 수정 중 오류가 발생했습니다.' };
  }
}

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