'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 초기화
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
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
            로그인
          </h1>
          <p className="text-body text-muted">
            안전한 공간으로 다시 돌아오세요
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 사용자명 */}
          <div>
            <label 
              htmlFor="username" 
              className="block text-caption text-muted mb-3 font-medium"
            >
              사용자명
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="사용자명을 입력하세요"
              className="w-full px-4 py-4 text-body border-2 border-accent bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none focus:border-primary transition-gentle focus-ring"
              style={{ minHeight: '44px' }}
              required
              disabled={isLoading}
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-caption text-muted mb-3 font-medium"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-4 text-body border-2 border-accent bg-surface text-foreground placeholder-muted rounded-lg focus:outline-none focus:border-primary transition-gentle focus-ring"
              style={{ minHeight: '44px' }}
              required
              disabled={isLoading}
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-surface px-6 py-4 rounded-lg text-body font-semibold hover:bg-primary-hover transition-gentle focus-ring shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-surface border-t-transparent rounded-full mr-2"></div>
                로그인 중...
              </div>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className="mt-8 text-center">
          <p className="text-body text-muted mb-4">
            아직 계정이 없으신가요?
          </p>
          <Link
            href="/signup"
            className="inline-block bg-accent text-primary px-6 py-3 rounded-lg text-body font-medium hover:bg-border transition-gentle focus-ring"
            style={{ minHeight: '44px' }}
          >
            회원가입하기
          </Link>
        </div>

        {/* 개발용 도우미 정보 */}
        <div className="mt-12 p-6 bg-subtle rounded-lg border border-accent">
          <h3 className="text-caption font-semibold text-foreground mb-3">
            💡 개발용 테스트 계정
          </h3>
          <div className="text-sm text-muted space-y-2">
            <p><strong>사용자명:</strong> mindful_writer</p>
            <p><strong>비밀번호:</strong> password1</p>
            <p className="text-xs pt-2 border-t border-accent">
              * 목업 사용자들의 비밀번호는 password1~5입니다
            </p>
          </div>
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