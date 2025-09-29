'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createPost } from '@/utils/supabasePostUtils';
import { CreatePostData } from '@/types/post';
import WriteHeader from '@/components/layout/WriteHeader';

function WritePageContent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    content: '',
    isAnonymous: false,
    isPrivate: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false); // Mark as unsaved when content changes
  };

  const handleSave = async () => {
    if (!currentUser) {
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
      const result = await createPost(formData, currentUser.id);

      if (result.success) {
        setIsSaved(true);
        setTimeout(() => {
          router.push(`/u/${currentUser.username}`);
        }, 1000);
      } else {
        alert(result.error || '글 발행 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Post creation error:', error);
      alert('글 발행 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };


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

export default function WritePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="content-container space-2xl pt-24">
        <div className="text-center">
          <p className="text-body text-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <WritePageContent />;
}