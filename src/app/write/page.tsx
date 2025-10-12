'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createPost } from '@/utils/supabasePostUtils';
import { CreatePostData, DraftPostData, POST_STORAGE_KEYS, PostVisibility } from '@/types/post';
import WriteHeader from '@/components/layout/WriteHeader';
import VisibilityModal from '@/components/ui/VisibilityModal';

function WritePageContent() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    content: '',
    isAnonymous: false,
    visibility: 'public',
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 임시저장 키 생성
  const getDraftKey = (userId: string) => `${POST_STORAGE_KEYS.DRAFT_POST}_${userId}`;

  // 임시저장
  const saveDraft = useCallback((data: CreatePostData) => {
    if (!currentUser) return;

    const draft: DraftPostData = {
      ...data,
      savedAt: new Date().toISOString(),
      userId: currentUser.id,
    };

    try {
      localStorage.setItem(getDraftKey(currentUser.id), JSON.stringify(draft));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [currentUser]);

  // 임시저장본 불러오기
  const loadDraft = useCallback(() => {
    if (!currentUser) return null;

    try {
      const draftJson = localStorage.getItem(getDraftKey(currentUser.id));
      if (!draftJson) return null;

      const draft: DraftPostData = JSON.parse(draftJson);

      // 사용자 검증
      if (draft.userId !== currentUser.id) return null;

      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [currentUser]);

  // 임시저장본 삭제
  const clearDraft = useCallback(() => {
    if (!currentUser) return;

    try {
      localStorage.removeItem(getDraftKey(currentUser.id));
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false); // Mark as unsaved when content changes
  };

  const handleSave = () => {
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

    // 공개 범위 선택 모달 표시
    setShowVisibilityModal(true);
  };

  const handleVisibilitySelect = async (visibility: PostVisibility) => {
    setShowVisibilityModal(false);
    setIsSubmitting(true);

    try {
      const postData = {
        ...formData,
        visibility,
      };

      const result = await createPost(postData, currentUser!.id);

      if (result.success) {
        clearDraft(); // 임시저장본 삭제
        setIsSaved(true);
        setTimeout(() => {
          router.push(`/u/${currentUser!.username}`);
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

  // 자동 임시저장 (2초 디바운스)
  useEffect(() => {
    if (!currentUser) return;

    // 빈 내용은 저장하지 않음
    if (!formData.title.trim() && !formData.content.trim()) {
      return;
    }

    // 타이핑 멈춘 후 2초 뒤 자동 저장
    const timeoutId = setTimeout(() => {
      saveDraft(formData);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formData, currentUser, saveDraft]);

  // 페이지 마운트 시 임시저장본 자동 복원
  useEffect(() => {
    if (!currentUser) return;

    const draft = loadDraft();

    if (draft) {
      // 자동으로 복원 (확인 메시지 없이)
      setFormData({
        title: draft.title,
        content: draft.content,
        isAnonymous: draft.isAnonymous || false,
        visibility: draft.visibility || 'public',
      });
      setLastSaved(new Date(draft.savedAt));
    }
  }, [currentUser, loadDraft]);

  return (
    <div className="min-h-screen bg-white">
      {/* Write Header */}
      <WriteHeader onSave={handleSave} isSubmitting={isSubmitting} isSaved={isSaved} lastSaved={lastSaved} />

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

      {/* Visibility Modal */}
      <VisibilityModal
        isOpen={showVisibilityModal}
        onClose={() => setShowVisibilityModal(false)}
        onSelect={handleVisibilitySelect}
        currentVisibility={formData.visibility}
      />
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