'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' /* | 'kakao' */ | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const { login, signInWithGoogle /*, signInWithKakao */ } = useAuth();
  const router = useRouter();

  // 모달 닫기 처리 (ESC키)
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 외부 클릭으로 모달 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setShowEmailForm(false);
      setFormData({ email: '', password: '' });
      setError('');
      setIsLoading(false);
      setOauthLoading(null);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData);

      if (result.success) {
        onClose();
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

  const handleGoogleLogin = async () => {
    setError('');
    setOauthLoading('google');

    try {
      const result = await signInWithGoogle();
      if (!result.success && result.error) {
        setError(result.error);
      }
      // 성공시 OAuth 콜백에서 처리됨
    } catch (err) {
      setError('구글 로그인 중 오류가 발생했습니다.');
    } finally {
      setOauthLoading(null);
    }
  };

  // TODO: 카카오 로그인 - 추후 업데이트 예정
  // const handleKakaoLogin = async () => {
  //   setError('');
  //   setOauthLoading('kakao');

  //   try {
  //     const result = await signInWithKakao();
  //     if (!result.success && result.error) {
  //       setError(result.error);
  //     }
  //     // 성공시 OAuth 콜백에서 처리됨
  //   } catch (err) {
  //     setError('카카오 로그인 중 오류가 발생했습니다.');
  //   } finally {
  //     setOauthLoading(null);
  //   }
  // };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] mx-4 p-8"
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="모달 닫기"
        >
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 제목 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {showEmailForm ? '이메일로 로그인' : 'We are all Anxy'}
          </h2>
          {!showEmailForm && (
            <p className="text-sm text-gray-600">
              불안할때 쓰는 글
            </p>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!showEmailForm ? (
          <>
            {/* OAuth 버튼들 */}
            <div className="space-y-3">
              {/* 구글 로그인 */}
              <button
                onClick={handleGoogleLogin}
                disabled={oauthLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }}
              >
                {oauthLoading === 'google' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                    <span>로그인 중...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>구글로 계속하기</span>
                  </>
                )}
              </button>

              {/* TODO: 카카오 로그인 - 추후 업데이트 예정 */}
              {/* <button
                onClick={handleKakaoLogin}
                disabled={oauthLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#FEE500',
                  color: '#000000',
                  minHeight: '44px'
                }}
              >
                {oauthLoading === 'kakao' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full"></div>
                    <span>로그인 중...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3C6.48 3 2 6.8 2 11.5c0 3.04 1.87 5.7 4.69 7.2-.15.52-.97 3.35-1 3.49-.04.21.08.21.17.15.07-.04 4.54-3 5.14-3.4.31.04.65.06 1 .06 5.52 0 10-3.8 10-8.5S17.52 3 12 3z"
                        fill="#000000"
                      />
                    </svg>
                    <span>카카오로 계속하기</span>
                  </>
                )}
              </button> */}

              {/* 이메일 로그인 */}
              <button
                onClick={() => setShowEmailForm(true)}
                disabled={oauthLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }}
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>이메일로 로그인</span>
              </button>
            </div>

            {/* 회원가입 링크 */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <button
                  onClick={() => {
                    onClose();
                    onSwitchToSignup();
                  }}
                  className="text-green-600 font-medium hover:underline"
                >
                  회원가입
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* 이메일 로그인 폼 */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="이메일 또는 닉네임"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>로그인 중...</span>
                  </div>
                ) : (
                  '로그인'
                )}
              </button>
            </form>

            {/* 돌아가기 버튼 */}
            <button
              onClick={() => setShowEmailForm(false)}
              className="mt-4 w-full text-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 다른 방법으로 로그인
            </button>

            {/* 회원가입 링크 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <button
                  onClick={() => {
                    onClose();
                    onSwitchToSignup();
                  }}
                  className="text-green-600 font-medium hover:underline"
                >
                  회원가입
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}