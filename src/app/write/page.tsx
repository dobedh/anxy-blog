'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createPost } from '@/utils/postUtils';
import { CATEGORIES } from '@/types/post';
import { CreatePostData } from '@/types/post';

function WritePageContent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    content: '',
    category: 'free',
    isAnonymous: false,
    isPrivate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const result = createPost(formData, currentUser.id);
      
      if (result.success) {
        alert('글이 성공적으로 발행되었습니다!');
        router.push(`/u/${currentUser.username}`);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="content-container space-2xl pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-hero font-bold text-foreground mb-4">
            새 글 쓰기
          </h1>
          <p className="text-body text-muted">
            당신의 이야기를 자유롭게 나누어보세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-3">
              제목 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="글 제목을 입력하세요"
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-foreground placeholder-muted"
              required
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-3">
              카테고리
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-foreground"
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* 내용 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-3">
              내용 *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="글 내용을 입력하세요..."
              rows={12}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-foreground placeholder-muted resize-vertical"
              required
            />
          </div>

          {/* 옵션 */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAnonymous"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="isAnonymous" className="ml-3 text-sm text-foreground">
                익명으로 게시
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="isPrivate" className="ml-3 text-sm text-foreground">
                비공개 글로 설정
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-muted hover:text-foreground transition-gentle"
            >
              취소
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-surface px-8 py-3 rounded-full font-medium hover:bg-primary-hover transition-gentle focus-ring shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '발행 중...' : '발행하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WritePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
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