'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Post, PostVisibility } from '@/types/post';
import { getPostById, deletePost, togglePostLike, checkUserLikedPost } from '@/utils/supabasePostUtils';
import { Comment } from '@/types/comment';
import { getCommentsByPostId, getCommentCount, createComment, formatCommentDate } from '@/utils/commentUtils';
import { useAuth } from '@/hooks/useAuth';
import DropdownMenu from '@/components/ui/DropdownMenu';
import FollowButton from '@/components/FollowButton';
import { getUserById } from '@/utils/supabaseUserUtils';
import { useRouter } from 'next/navigation';

interface PostPageProps {
  params: { id: string };
}

export default function PostPage({ params }: PostPageProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [authorUsername, setAuthorUsername] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [currentLikeCount, setCurrentLikeCount] = useState(0);

  const { currentUser, isAuthenticated } = useAuth();
  const router = useRouter();

  const postId = use(params).id;

  // Visibility label helper
  const getVisibilityLabel = (visibility: PostVisibility): string => {
    const labels: Record<PostVisibility, string> = {
      public: '전체 공개',
      followers: '팔로워 공개',
      private: '비공개'
    };
    return labels[visibility] || '전체 공개';
  };

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);

      console.log('Loading post with ID:', postId);

      // Load post from Supabase
      const postData = await getPostById(postId);

      if (!postData) {
        console.log('Post not found:', postId);
        notFound();
        return;
      }

      console.log('Post found:', postData);
      setPost(postData);
      setIsLoading(false);
    };

    loadPost();
  }, [postId]);

  // 작성자 username 로드
  useEffect(() => {
    const loadAuthorUsername = async () => {
      if (post?.authorId) {
        const author = await getUserById(post.authorId);
        setAuthorUsername(author?.username || null);
      }
    };
    loadAuthorUsername();
  }, [post?.authorId]);

  useEffect(() => {
    if (postId) {
      const loadComments = () => {
        const postComments = getCommentsByPostId(postId);
        const count = getCommentCount(postId);
        setComments(postComments);
        setCommentCount(count);
      };

      loadComments();
    }
  }, [postId]);

  // 좋아요 상태 및 카운트 초기화
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (post && isAuthenticated && currentUser) {
        try {
          const liked = await checkUserLikedPost(post.id, currentUser.id);
          setIsLiked(liked);
        } catch (error) {
          console.error('Error checking like status:', error);
          setIsLiked(false);
        }
      }

      // 좋아요 카운트 초기화
      if (post) {
        setCurrentLikeCount(post.likes);
      }
    };

    checkLikeStatus();
  }, [post, isAuthenticated, currentUser]);


  const handleDeletePost = async () => {
    if (!post || !currentUser) return;

    const confirmDelete = confirm('정말로 이 글을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
      const result = await deletePost(post.id, currentUser.id);
      if (result.success) {
        alert('글이 삭제되었습니다.');
        router.push('/');
      } else {
        alert(result.error || '글 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      alert('글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditPost = () => {
    if (!post) return;
    router.push(`/edit/${post.id}`);
  };

  const handleSharePost = async () => {
    if (!post) return;

    const postUrl = window.location.href;

    // Try Web Share API first (for mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: postUrl
        });
      } catch (error) {
        // User cancelled share or error occurred
        console.log('Share cancelled or error:', error);
      }
    } else {
      // Fallback to clipboard copy
      try {
        await navigator.clipboard.writeText(postUrl);
        alert('링크가 복사되었습니다!');
      } catch (error) {
        console.error('Copy to clipboard error:', error);
        alert('링크 복사 중 오류가 발생했습니다.');
      }
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !currentUser || !post) {
      // TODO: Show login prompt or redirect to login
      return;
    }

    if (isLikeLoading) return;

    setIsLikeLoading(true);
    try {
      const result = await togglePostLike(post.id, currentUser.id);
      if (result.success) {
        setIsLiked(result.liked);
        // 좋아요 카운트 업데이트 (실제 카운트 반영)
        setCurrentLikeCount(prev => result.liked ? prev + 1 : prev - 1);
      } else {
        console.error('Error toggling like:', result.error);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!commentInput.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const result = createComment(
        { content: commentInput, postId },
        currentUser.id,
        currentUser.username
      );

      if (result.success) {
        setCommentInput('');
        // Reload comments
        const postComments = getCommentsByPostId(postId);
        const count = getCommentCount(postId);
        setComments(postComments);
        setCommentCount(count);
      } else {
        alert(result.error || '댓글 작성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null; // notFound() will handle this
  }

  // Check if current user is the post author
  const isOwner = currentUser && post?.authorId && currentUser.id === post.authorId;
  const canEdit = isOwner && !post?.isAnonymous;

  // Prepare menu items based on ownership
  const menuItems = isOwner
    ? [
        { label: '수정하기', onClick: handleEditPost },
        { label: '삭제하기', onClick: handleDeletePost, className: 'text-red-600 hover:bg-red-50' }
      ]
    : [
        { label: '공유하기', onClick: handleSharePost }
      ];

  return (
    <div className="content-container space-2xl pt-64">
      {/* 1. Title */}
      <div className="mb-8 mt-32">
        <h1 className="text-hero font-bold text-foreground leading-tight">
          {post.title}
        </h1>
      </div>

      {/* 2. Author info with follow button, date, and menu */}
      <div className="flex items-center gap-4 mb-6">
        {/* Left section: Author + Follow button */}
        <div className="flex items-center gap-4">
          {authorUsername ? (
            <Link
              href={`/u/${authorUsername}`}
              className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-gentle cursor-pointer focus-ring rounded-md px-1 -mx-1"
              aria-label={`${post.author}님의 프로필 보기`}
            >
              {post.author}
            </Link>
          ) : (
            <span className="text-lg font-medium text-gray-900">{post.author}</span>
          )}
          {post.authorId && !isOwner && (
            <FollowButton
              targetUserId={post.authorId}
              targetUsername={post.author}
              variant="compact"
            />
          )}
        </div>

        {/* Spacer to push date and menu to the right */}
        <div className="flex-1"></div>

        {/* Right section: Date + Menu button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span>{post.date}</span>
            <span>·</span>
            <span>{getVisibilityLabel(post.visibility)}</span>
          </div>
          <DropdownMenu
            trigger={
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            }
            items={menuItems}
            align="right"
          />
        </div>
      </div>

      {/* 3. Separator line */}
      <div className="border-t border-gray-200 mb-6"></div>

      {/* 4. Main content */}
      <div className="max-w-4xl mb-12">
        <div className="prose prose-lg max-w-none">
          <div className="text-body text-foreground leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </div>

      {/* 5. Like and comment actions - redesigned */}
      <div className="flex items-center gap-4 mb-8">
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={isLikeLoading || !isAuthenticated}
          className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLiked
              ? 'border-red-300 text-red-600 hover:bg-red-50'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <svg
            className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-700'}`}
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{currentLikeCount}</span>
        </button>

        {/* Comment button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>댓글 {commentCount}</span>
        </button>
      </div>

      {/* 6. Comments section - conditional */}
      {showComments && (
        <div className="border-t border-gray-200 pt-8 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">댓글 {commentCount}</h3>

          {/* Comment input */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">
                    {currentUser?.username.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    disabled={isSubmittingComment}
                    className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-300 placeholder-gray-500 disabled:opacity-50"
                  />
                  {commentInput.trim() && (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingComment ? '댓글 작성 중...' : '댓글 작성'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                홈에서 로그인하기
              </Link>
            </div>
          )}

          {/* Comments list */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-white">
                      {comment.authorName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{comment.authorName}</span>
                      {comment.authorId === post?.authorId && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">작가</span>
                      )}
                      <span className="text-xs text-gray-500">{formatCommentDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">
                      {comment.content}
                    </p>
                    {comment.isEdited && (
                      <span className="text-xs text-gray-500">수정됨</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">아직 댓글이 없습니다.</p>
              <p className="text-gray-400 text-xs mt-1">첫 번째 댓글을 작성해보세요!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}