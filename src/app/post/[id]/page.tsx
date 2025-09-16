'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Post } from '@/types/post';
import { getPostById } from '@/utils/postUtils';

interface PostPageProps {
  params: { id: string };
}

export default function PostPage({ params }: PostPageProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const postId = params.id;

  useEffect(() => {
    const loadPost = () => {
      setIsLoading(true);
      
      console.log('Loading post with ID:', postId);
      
      // Get post data
      const postData = getPostById(postId);
      
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

  return (
    <div className="content-container space-2xl pt-24">
      {/* Header */}
      <div className="mb-12">
        {/* Back button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-gentle mb-8 focus-ring rounded-lg px-2 py-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          돌아가기
        </Link>

        {/* Post meta */}
        <div className="flex items-center gap-3 mb-6 text-caption text-secondary">
          <span className="font-semibold px-3 py-1.5 bg-accent rounded-full text-primary text-xs uppercase tracking-wider">
            {post.category}
          </span>
          <span className="text-border">·</span>
          <time className="font-medium">{post.date}</time>
          <span className="text-border">·</span>
          <span className="font-medium">by {post.author}</span>
        </div>

        {/* Title */}
        <h1 className="text-hero font-bold text-foreground leading-tight">
          {post.title}
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <div className="text-body text-foreground leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 mt-12 pt-8 border-t border-border text-caption text-secondary">
        <button className="flex items-center gap-2 hover:text-primary transition-gentle focus-ring rounded-lg p-2 font-medium">
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>좋아요 {post.likes}</span>
        </button>
        
        <button className="flex items-center gap-2 hover:text-primary transition-gentle focus-ring rounded-lg p-2 font-medium">
          <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>댓글 {post.comments}</span>
        </button>
      </div>
    </div>
  );
}