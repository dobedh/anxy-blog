'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { updateUser, validateUsername } from '@/utils/supabaseUserUtils';

export default function EditProfilePage() {
  const { currentUser, isAuthenticated, isLoading, checkUsernameAvailability } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // 현재 사용자 정보로 폼 초기화
  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        displayName: currentUser.displayName || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser]);

  // 사용자명 실시간 중복 체크 (기존 사용자명과 다를 때만)
  useEffect(() => {
    if (!formData.username || !currentUser || formData.username === currentUser.username) {
      setIsCheckingUsername(false);
      return;
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true);

      // 기본 유효성 검사 먼저 수행
      const validation = validateUsername(formData.username);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, username: validation.error! }));
        setIsCheckingUsername(false);
        return;
      }

      // 중복 체크 수행
      const { available, error } = await checkUsernameAvailability(formData.username);

      if (error) {
        setErrors(prev => ({ ...prev, username: '사용자명 확인 중 오류가 발생했습니다. 다시 시도해주세요.' }));
      } else if (!available) {
        setErrors(prev => ({ ...prev, username: '이미 사용 중인 사용자명입니다.' }));
      } else {
        // 사용 가능한 사용자명
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.username;
          return newErrors;
        });
      }

      setIsCheckingUsername(false);
    };

    const debounceTimer = setTimeout(checkUsername, 500); // 500ms 디바운스
    return () => clearTimeout(debounceTimer);
  }, [formData.username, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 해당 필드의 에러 초기화
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 사용자명 검증 (기본 유효성만 - 중복체크는 실시간으로 처리됨)
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error!;
    }

    // 표시명 검증
    if (!formData.displayName.trim()) {
      newErrors.displayName = '표시명을 입력해주세요.';
    } else if (formData.displayName.length > 30) {
      newErrors.displayName = '표시명은 30자 이하여야 합니다.';
    }

    // bio는 선택사항이므로 길이 체크만
    if (formData.bio.length > 200) {
      newErrors.bio = '소개는 200자 이하여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const result = await updateUser(currentUser.id, {
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio,
      });

      if (result.success) {
        // 사용자명이 변경된 경우 새로운 사용자명으로 리다이렉트
        router.push(`/u/${formData.username}`);
      } else {
        setErrors({ general: result.error || '프로필 업데이트에 실패했습니다.' });
      }
    } catch (err) {
      setErrors({ general: '프로필 업데이트 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-hero font-bold text-foreground mb-4">
            프로필 수정
          </h1>
          <p className="text-body text-muted">
            프로필 정보를 수정하세요
          </p>
        </div>

        {/* 프로필 수정 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 전체 에러 메시지 */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* 사용자명 */}
          <div>
            <label
              htmlFor="username"
              className="block text-caption text-muted mb-3 font-medium"
            >
              사용자명 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="영문, 숫자, 언더스코어 3-20자"
                className={`w-full px-4 py-4 text-body border-2 bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none transition-gentle focus-ring ${
                  errors.username ? 'border-red-300' : 'border-accent focus:border-primary'
                }`}
                style={{ minHeight: '44px' }}
                required
                disabled={isSubmitting}
              />
              {isCheckingUsername ? (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : formData.username && formData.username !== currentUser?.username && !errors.username && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {errors.username && (
              <p className="mt-2 text-sm text-red-600">{errors.username}</p>
            )}
            {formData.username !== currentUser?.username && (
              <p className="mt-2 text-xs text-amber-600">⚠️ 사용자명을 변경하면 프로필 주소가 바뀝니다.</p>
            )}
          </div>

          {/* 표시명 */}
          <div>
            <label
              htmlFor="displayName"
              className="block text-caption text-muted mb-3 font-medium"
            >
              표시명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="표시명을 입력하세요"
              className={`w-full px-4 py-4 text-body border-2 bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none transition-gentle focus-ring ${
                errors.displayName ? 'border-red-300' : 'border-accent focus:border-primary'
              }`}
              style={{ minHeight: '44px' }}
              required
              disabled={isSubmitting}
            />
            {errors.displayName && (
              <p className="mt-2 text-sm text-red-600">{errors.displayName}</p>
            )}
          </div>

          {/* 한 줄 소개 */}
          <div>
            <label
              htmlFor="bio"
              className="block text-caption text-muted mb-3 font-medium"
            >
              한 줄 소개
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="자신을 간단히 소개해주세요"
              rows={3}
              className={`w-full px-4 py-4 text-body border-2 bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none transition-gentle focus-ring resize-none ${
                errors.bio ? 'border-red-300' : 'border-accent focus:border-primary'
              }`}
              disabled={isSubmitting}
            />
            {errors.bio && (
              <p className="mt-2 text-sm text-red-600">{errors.bio}</p>
            )}
          </div>

          {/* 버튼들 */}
          <div className="space-y-4">
            {/* 저장 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting || isCheckingUsername || Object.keys(errors).length > 0}
              className="w-full bg-primary text-surface px-6 py-4 rounded-lg text-body font-semibold hover:bg-primary-hover transition-gentle focus-ring shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px' }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-surface border-t-transparent rounded-full mr-2"></div>
                  저장 중...
                </div>
              ) : (
                '변경사항 저장'
              )}
            </button>

            {/* 취소 버튼 */}
            <button
              type="button"
              onClick={() => router.push(`/u/${currentUser.username}`)}
              disabled={isSubmitting}
              className="w-full bg-accent text-primary px-6 py-4 rounded-lg text-body font-medium hover:bg-border transition-gentle focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px' }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}