import Link from 'next/link';
import { Post } from '@/types/post';
import { getCommentCount } from '@/utils/commentUtils';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { id, title, excerpt, author, date, likes } = post;
  const commentCount = getCommentCount(id);
  return (
    <article className="py-8 border-b border-gray-200 last:border-b-0 group">
      {/* Meta Information */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span className="font-medium">{author}</span>
        <span>·</span>
        <time>{date}</time>
      </div>
      
      {/* Content */}
      <Link href={`/post/${id}`} className="block">
        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors leading-tight line-clamp-2">
          {title}
        </h2>
        <p className="text-gray-600 text-base leading-relaxed mb-4 line-clamp-3">
          {excerpt}
        </p>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <button className="flex items-center gap-1 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{likes}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{commentCount}</span>
        </button>
      </div>
    </article>
  );
}