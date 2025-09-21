'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Post } from '@/types/post';
import { getPostById, updatePost } from '@/utils/supabasePostUtils';
import { useAuth } from '@/hooks/useAuth';
import WriteHeader from '@/components/layout/WriteHeader';

interface EditPostPageProps {
  params: { id: string };
}

function EditPageContent({ postId }: { postId: string }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  // Load post data
  useEffect(() => {
    const loadPost = async () => {
      // Wait for currentUser to be available
      if (!currentUser) {
        console.log('⏳ Waiting for currentUser...');
        return;
      }

      if (post) {
        console.log('📦 Post already loaded');
        return; // Already loaded
      }

      console.log('🔄 Loading post for editing...');
      setPostLoading(true);

      try {
        const postData = await getPostById(postId);

        if (!postData) {
          console.log('❌ Post not found');
          notFound();
          return;
        }

        // Check if user owns this post
        if (postData.authorId !== currentUser.id) {
          console.log('❌ Permission denied: not post owner');
          alert('이 글을 수정할 권한이 없습니다.');
          router.push(`/post/${postId}`);
          return;
        }

        console.log('✅ Post loaded successfully for editing');
        setPost(postData);
        setFormData({
          title: postData.title,
          content: postData.content,
        });
      } catch (error) {
        console.error('Error loading post:', error);
        alert('글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setPostLoading(false);
      }
    };

    loadPost();
  }, [postId, currentUser, post, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false); // Mark as unsaved when content changes
  };

  const handleSave = async () => {
    if (!currentUser || !post) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updates = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.content.trim().slice(0, 150) + (formData.content.trim().length > 150 ? '...' : ''),
      };

      const result = await updatePost(postId, updates, currentUser.id);

      if (result.success) {
        setIsSaved(true);
        setTimeout(() => {
          router.push(`/post/${postId}`);
        }, 1000);
      } else {
        alert(result.error || '글 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Update post error:', error);
      alert('글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while fetching post
  if (postLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Don't render until post is loaded
  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Write Header */}
      <WriteHeader onSave={handleSave} isSubmitting={isSubmitting} isSaved={isSaved} />

      {/* Writing area */}
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-20">
        {/* Title input - borderless */}
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="제목을 입력하세요"
          className="w-full text-3xl font-light text-gray-900 placeholder-gray-400 border-0 outline-none focus:outline-none mb-8"
        />

        {/* Content textarea - borderless, full height */}
        <textarea
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          placeholder="당신의 이야기를 들려주세요..."
          className="w-full min-h-screen text-lg leading-relaxed text-gray-700 placeholder-gray-400 border-0 outline-none focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const router = useRouter();
  const postId = use(params).id;

  useEffect(() => {
    // Only redirect if loading is complete and definitely not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading if auth is loading OR if authenticated but currentUser is not yet loaded
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected to login
  }

  // Show loading while currentUser is being fetched
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">사용자 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  return <EditPageContent postId={postId} />;
}