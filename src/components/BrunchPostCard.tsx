import Link from 'next/link';
import { Post } from '@/types/post';
import { useState, useEffect } from 'react';
import { togglePostLike, checkUserLikedPost } from '@/utils/supabasePostUtils';
import { useAuth } from '@/hooks/useAuth';
import LoginModal from '@/components/ui/LoginModal';
import SignupModal from '@/components/ui/SignupModal';

interface BrunchPostCardProps {
  post: Post;
}

export default function BrunchPostCard({ post }: BrunchPostCardProps) {
  const { id, title, excerpt, author, date, postNumber, authorId } = post;
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const { currentUser, isAuthenticated } = useAuth();

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
      <div className="post-card-horizontal">
        {/* Content Section - Left */}
        <div className="flex-1">
          {/* Content */}
          <Link href={postUrl} className="block cursor-pointer">
            <h2 className="text-lg text-foreground mb-2 group-hover:opacity-80 transition-colors leading-tight line-clamp-2 font-medium">
              {title}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-3">
              {excerpt}
            </p>
          </Link>

          {/* Meta Information - Moved to bottom */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-normal text-xs">{author}</span>
              <span className="text-gray-300">·</span>
              <time className="text-gray-400 text-xs">{date}</time>
            </div>

            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={isLoading}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <svg
                className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`}
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
            </button>
          </div>
        </div>

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