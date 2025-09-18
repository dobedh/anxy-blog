export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  parentId?: string; // for reply functionality (future)
}

export interface CreateCommentData {
  content: string;
  postId: string;
}

export const COMMENT_STORAGE_KEYS = {
  COMMENTS: 'anxy_comments',
} as const;