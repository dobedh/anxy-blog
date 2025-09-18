import Link from 'next/link';
import { Post } from '@/types/post';
import { useState, useEffect } from 'react';

interface BrunchPostCardProps {
  post: Post;
}

export default function BrunchPostCard({ post }: BrunchPostCardProps) {
  const { id, title, excerpt, author, date } = post;
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Check if this post is liked
    const savedLikedPosts = localStorage.getItem('anxy_liked_posts');
    if (savedLikedPosts) {
      try {
        const likedPostIds = JSON.parse(savedLikedPosts) as string[];
        setIsLiked(likedPostIds.includes(id));
      } catch (error) {
        console.error('Error loading liked status:', error);
      }
    }
  }, [id]);

  const handleLike = () => {
    const savedLikedPosts = localStorage.getItem('anxy_liked_posts');
    let likedPostIds: string[] = [];

    if (savedLikedPosts) {
      try {
        likedPostIds = JSON.parse(savedLikedPosts) as string[];
      } catch (error) {
        console.error('Error parsing liked posts:', error);
      }
    }

    if (isLiked) {
      // Remove from liked posts
      likedPostIds = likedPostIds.filter(postId => postId !== id);
    } else {
      // Add to liked posts
      likedPostIds.push(id);
    }

    localStorage.setItem('anxy_liked_posts', JSON.stringify(likedPostIds));
    setIsLiked(!isLiked);
  };

  return (
    <article className="py-8 border-b border-gray-200 last:border-b-0 group">
      <div className="post-card-horizontal">
        {/* Content Section - Left */}
        <div className="flex-1">
          {/* Content */}
          <Link href={`/post/${id}`} className="block">
            <h2 className="text-post-title text-gray-900 mb-3 group-hover:text-gray-700 transition-colors leading-tight line-clamp-2">
              {title}
            </h2>
            <p className="text-gray-500 text-base leading-loose mb-4 line-clamp-3">
              {excerpt}
            </p>
          </Link>

          {/* Meta Information - Moved to bottom */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-meta-info">
              <span className="text-gray-400 font-medium text-sm">{author}</span>
              <span className="text-gray-300">·</span>
              <time className="text-gray-400 text-sm">{date}</time>
            </div>

            {/* Like button */}
            <button
              onClick={handleLike}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
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
    </article>
  );
}