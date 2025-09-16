'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  redirectTo = '/login',
  loadingComponent
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩이 완료된 후에 리다이렉트 처리
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // 로딩 중
  if (isLoading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인이 필요한 페이지인데 로그인하지 않은 경우
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 로그인한 사용자가 접근하면 안 되는 페이지인 경우 (로그인, 회원가입 등)
  if (!requireAuth && isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">홈으로 이동 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// 로그인이 필요한 페이지용 래퍼
export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true}>
      {children}
    </ProtectedRoute>
  );
}

// 로그인하지 않은 사용자만 접근 가능한 페이지용 래퍼 (로그인, 회원가입)
export function RequireGuest({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}