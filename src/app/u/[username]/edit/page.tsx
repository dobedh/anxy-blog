'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getUserByUsername, updateUser } from '@/utils/supabaseUserUtils';
import { User } from '@/types/user';

interface EditProfilePageProps {
  params: { username: string };
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const { currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const username = decodeURIComponent(use(params).username);

  // 인증 상태 확인 - 타이머 기반 보호
  useEffect(() => {
    console.log('🔍 Profile edit page auth check:', {
      authLoading,
      isAuthenticated,
      currentUser: currentUser ? 'exists' : 'null',
      willCheckRedirect: !authLoading && !isAuthenticated
    });

    if (!authLoading && !isAuthenticated) {
      // React 상태 동기화를 위한 짧은 지연
      const redirectTimer = setTimeout(() => {
        // 상태 안정화 후 재확인
        if (!isAuthenticated) {
          console.log('🔒 Profile edit page requires authentication - redirecting to home');
          router.push('/');
        } else {
          console.log('✅ Authentication confirmed - staying on profile edit page');
        }
      }, 100);

      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, authLoading, router]);

  // 사용자 데이터 로딩
  useEffect(() => {
    const loadUserData = async () => {
      // 인증되지 않았거나 사용자 정보가 없으면 로딩하지 않음
      if (!isAuthenticated || !currentUser) {
        return;
      }

      const userData = await getUserByUsername(username);

      if (!userData) {
        router.push('/404');
        return;
      }

      // 본인 프로필만 편집 가능
      if (currentUser.id !== userData.id) {
        router.push(`/u/${username}`);
        return;
      }

      setUser(userData);
      setBio(userData.bio || '');
      setIsLoading(false);
    };

    if (isAuthenticated && currentUser) {
      loadUserData();
    }
  }, [username, currentUser, isAuthenticated, router]);

  const handleSave = async () => {
    if (!user || !currentUser) return;

    setIsSaving(true);

    try {
      const result = await updateUser(user.id, {
        bio: bio.trim()
      });

      if (result.success) {
        router.push(`/u/${username}`);
      } else {
        alert(result.error || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/u/${username}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container" style={{paddingTop: '80px'}}>
      <div className="max-w-md mx-auto">
        <h1 className="text-hero font-bold text-foreground mb-8 text-center">
          프로필 수정
        </h1>

        <div className="space-y-6">

          {/* 소개글 입력 */}
          <div>
            <label htmlFor="bio" className="block text-body font-medium text-foreground mb-2">
              소개글
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-body bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-gentle resize-none"
              placeholder="자신을 소개해보세요"
              maxLength={200}
            />
            <p className="text-caption text-muted mt-1">
              {bio.length}/200
            </p>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-surface text-foreground border border-border rounded-lg font-medium hover:bg-subtle transition-gentle focus-ring"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-primary text-surface rounded-lg font-medium hover:bg-primary-hover transition-gentle focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  저장 중...
                </span>
              ) : (
                '저장'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}