'use client';

import { useEffect, useState } from 'react';
import { needsMigration, runMigration } from '@/utils/migration';

interface MigrationHandlerProps {
  children: React.ReactNode;
}

export default function MigrationHandler({ children }: MigrationHandlerProps) {
  const [isMigrationComplete, setIsMigrationComplete] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  useEffect(() => {
    const handleMigration = async () => {
      try {
        // 마이그레이션이 필요한지 체크
        if (needsMigration()) {
          console.log('🔄 Migration needed, starting...');
          const result = await runMigration();
          
          if (!result.success) {
            console.error('❌ Migration failed:', result.errors);
            setMigrationError('데이터 마이그레이션 중 오류가 발생했습니다.');
          } else {
            console.log('✅ Migration completed successfully');
            
            // 마이그레이션 결과 로그
            if (result.changes.usersCreated > 0) {
              console.log(`✅ Created ${result.changes.usersCreated} mock users`);
            }
            if (result.changes.postsUpdated > 0) {
              console.log(`✅ Updated ${result.changes.postsUpdated} posts`);
            }
          }
        } else {
          console.log('✅ No migration needed');
        }
        
        setIsMigrationComplete(true);
      } catch (error) {
        console.error('❌ Migration handler error:', error);
        setMigrationError('마이그레이션 중 예상치 못한 오류가 발생했습니다.');
        setIsMigrationComplete(true); // 에러가 있어도 앱은 계속 실행
      }
    };

    handleMigration();
  }, []);

  // 마이그레이션 진행 중
  if (!isMigrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">앱을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 마이그레이션 에러 (하지만 앱은 계속 실행)
  if (migrationError) {
    console.warn('⚠️ App started with migration warning:', migrationError);
  }

  return <>{children}</>;
}