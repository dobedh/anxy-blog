import Link from 'next/link';
import { Post } from '@/types/post';
import { useState, useEffect } from 'react';
import { togglePostLike, checkUserLikedPost } from '@/utils/supabasePostUtils';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from '@/components/ui/LoginModal';
import SignupModal from '@/components/ui/SignupModal';
import { getCommentCount } from '@/utils/commentUtils';

interface BrunchPostCardProps {
  post: Post;
}

export default function BrunchPostCard({ post }: BrunchPostCardProps) {
  const { id, title, excerpt, author, date, postNumber, authorId, likes, comments } = post;
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();
  const commentCount = getCommentCount(id.toString());

  // Generate post URL - prefer short URL if available
  const postUrl = (postNumber && author && !post.isAnonymous)
    ? `/u/${author}/${postNumber}`
    : `/post/${id}`;

  useEffect(() => {
    const checkLikedStatus = async () => {
      if (isAuthenticated && currentUser) {
        try {
          const liked = await checkUserLikedPost(id, currentUser.id);
          setIsLiked(liked);
        } catch (error) {
          console.error('Error checking liked status:', error);
          setIsLiked(false);
        }
      }
    };

    checkLikedStatus();
  }, [id, isAuthenticated, currentUser]);

  const handleLike = async () => {
    if (!isAuthenticated || !currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await togglePostLike(id, currentUser.id);
      if (result.success) {
        setIsLiked(result.liked);
      } else {
        console.error('Error toggling like:', result.error);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article className="py-6 border-b border-gray-200 last:border-b-0 group">
      {/* Profile, Author Name, and Date */}
      <div className="flex items-center gap-2 mb-3">
        <Link href={`/u/${author}`} className="cursor-pointer">
          <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors">
          </div>
        </Link>
        <Link href={`/u/${author}`} className="cursor-pointer">
          <span className="text-sm font-medium text-gray-700 hover:text-gray-900">{author}</span>
        </Link>
        <span className="text-gray-300">·</span>
        <time className="text-xs text-gray-400">{date}</time>
      </div>

      {/* Content */}
      <Link href={postUrl} className="block cursor-pointer mb-3">
        <h2 className="text-lg text-foreground mb-2 group-hover:opacity-80 transition-colors leading-tight line-clamp-2 font-medium">
          {title}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
          {excerpt}
        </p>
      </Link>

      {/* Bottom Actions - Like and Comment */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          disabled={isLoading}
          className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <svg
            className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : ''}`}
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="text-xs">{likes}</span>
        </button>

        <Link href={postUrl} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs">{commentCount}</span>
        </Link>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </article>
  );
}