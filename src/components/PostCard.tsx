import Link from 'next/link';
import { Post } from '@/types/post';
import { getCommentCount } from '@/utils/commentUtils';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { id, title, excerpt, author, date, likes, postNumber } = post;
  const commentCount = getCommentCount(id.toString());

  // Generate post URL - prefer short URL if available
  const postUrl = (postNumber && author && !post.isAnonymous)
    ? `/u/${author}/${postNumber}`
    : `/post/${id}`;

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
        <Link href={postUrl} className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs">{likes}</span>
        </Link>

        <Link href={postUrl} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs">{commentCount}</span>
        </Link>
      </div>
    </article>
  );
}