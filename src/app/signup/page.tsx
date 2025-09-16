'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { validateUsername, validateDisplayName, checkUsernameAvailability } from '@/utils/userUtils';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const { signup, isAuthenticated } = useAuth();
  const router = useRouter();

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

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

  // 사용자명 실시간 검증
  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username) return;
      
      setIsCheckingUsername(true);
      
      // 기본 유효성 검사
      const validation = validateUsername(formData.username);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, username: validation.error! }));
        setIsCheckingUsername(false);
        return;
      }
      
      // 중복 체크
      setTimeout(() => {
        const isAvailable = checkUsernameAvailability(formData.username);
        if (!isAvailable) {
          setErrors(prev => ({ ...prev, username: '이미 사용 중인 사용자명입니다.' }));
        }
        setIsCheckingUsername(false);
      }, 300);
    };

    checkUsername();
  }, [formData.username]);

  // 비밀번호 확인 검증
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  }, [formData.password, formData.confirmPassword]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 사용자명 검증
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error!;
    } else if (!checkUsernameAvailability(formData.username)) {
      newErrors.username = '이미 사용 중인 사용자명입니다.';
    }

    // 표시명 검증
    const displayNameValidation = validateDisplayName(formData.displayName);
    if (!displayNameValidation.isValid) {
      newErrors.displayName = displayNameValidation.error!;
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    // 비밀번호 확인 검증
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const result = await signup({
        username: formData.username,
        displayName: formData.displayName,
        password: formData.password,
        bio: formData.bio,
      });
      
      if (result.success) {
        // 회원가입 성공 시 자동 로그인되어 홈으로 이동
        router.push('/');
      } else {
        setErrors({ general: result.error || '회원가입에 실패했습니다.' });
      }
    } catch (err) {
      setErrors({ general: '회원가입 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-hero font-bold text-foreground mb-4">
            회원가입
          </h1>
          <p className="text-body text-muted">
            안전한 공간에서 새로운 시작을 해보세요
          </p>
        </div>

        {/* 회원가입 폼 */}
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
                disabled={isLoading}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            {errors.username && (
              <p className="mt-2 text-sm text-red-600">{errors.username}</p>
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
              placeholder="다른 사용자에게 보여질 이름"
              className={`w-full px-4 py-4 text-body border-2 bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none transition-gentle focus-ring ${
                errors.displayName ? 'border-red-300' : 'border-accent focus:border-primary'
              }`}
              style={{ minHeight: '44px' }}
              required
              disabled={isLoading}
            />
            {errors.displayName && (
              <p className="mt-2 text-sm text-red-600">{errors.displayName}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-caption text-muted mb-3 font-medium"
            >
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="6자 이상 입력하세요"
              className={`w-full px-4 py-4 text-body border-2 bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none transition-gentle focus-ring ${
                errors.password ? 'border-red-300' : 'border-accent focus:border-primary'
              }`}
              style={{ minHeight: '44px' }}
              required
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-caption text-muted mb-3 font-medium"
            >
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="비밀번호를 다시 입력하세요"
              className={`w-full px-4 py-4 text-body border-2 bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none transition-gentle focus-ring ${
                errors.confirmPassword ? 'border-red-300' : 'border-accent focus:border-primary'
              }`}
              style={{ minHeight: '44px' }}
              required
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* 한 줄 소개 (선택사항) */}
          <div>
            <label 
              htmlFor="bio" 
              className="block text-caption text-muted mb-3 font-medium"
            >
              한 줄 소개 <span className="text-muted">(선택사항)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="자신을 간단히 소개해주세요"
              rows={3}
              className="w-full px-4 py-4 text-body border-2 border-accent bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none focus:border-primary transition-gentle focus-ring resize-none"
              disabled={isLoading}
            />
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={isLoading || isCheckingUsername || Object.keys(errors).length > 0}
            className="w-full bg-primary text-surface px-6 py-4 rounded-lg text-body font-semibold hover:bg-primary-hover transition-gentle focus-ring shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-surface border-t-transparent rounded-full mr-2"></div>
                계정 생성 중...
              </div>
            ) : (
              '계정 만들기'
            )}
          </button>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-8 text-center">
          <p className="text-body text-muted mb-4">
            이미 계정이 있으신가요?
          </p>
          <Link
            href="/login"
            className="inline-block bg-accent text-primary px-6 py-3 rounded-lg text-body font-medium hover:bg-border transition-gentle focus-ring"
            style={{ minHeight: '44px' }}
          >
            로그인하기
          </Link>
        </div>

        {/* 홈으로 돌아가기 */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-muted hover:text-primary transition-gentle focus-ring rounded-lg px-3 py-2"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}