'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  migrateLocalStorageToSupabase,
  checkMigrationStatus,
  cleanupLocalStorageData,
  restoreFromBackup,
  MigrationResult
} from '@/utils/migrationUtils'

export default function MigrationTool() {
  const { isAuthenticated, currentUser } = useAuth()
  const [migrationStatus, setMigrationStatus] = useState<{
    isCompleted: boolean
    hasLocalData: boolean
    localDataSummary: { postsCount: number; usersCount: number }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // 마이그레이션 상태 확인
    const status = checkMigrationStatus()
    setMigrationStatus(status)
  }, [])

  const handleMigration = async () => {
    if (!isAuthenticated) return

    setIsLoading(true)
    setMigrationResult(null)

    try {
      const result = await migrateLocalStorageToSupabase()
      setMigrationResult(result)

      // 상태 업데이트
      const newStatus = checkMigrationStatus()
      setMigrationStatus(newStatus)
    } catch (error) {
      console.error('마이그레이션 오류:', error)
      setMigrationResult({
        success: false,
        postsCount: 0,
        usersCount: 0,
        errors: ['마이그레이션 중 예상치 못한 오류가 발생했습니다.']
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanup = () => {
    if (confirm('localStorage 데이터를 정리하시겠습니까? (백업 데이터는 유지됩니다)')) {
      const result = cleanupLocalStorageData()
      if (result.success) {
        alert('localStorage 데이터가 정리되었습니다.')
        const newStatus = checkMigrationStatus()
        setMigrationStatus(newStatus)
      } else {
        alert(`정리 실패: ${result.error}`)
      }
    }
  }

  const handleRestore = () => {
    if (confirm('백업 데이터를 복원하시겠습니까?')) {
      const result = restoreFromBackup()
      if (result.success) {
        alert('백업 데이터가 복원되었습니다.')
        const newStatus = checkMigrationStatus()
        setMigrationStatus(newStatus)
      } else {
        alert(`복원 실패: ${result.error}`)
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-surface rounded-lg border border-gray-200">
        <h3 className="text-title mb-4">데이터 마이그레이션</h3>
        <p className="text-body text-gray-600">
          데이터 마이그레이션을 위해 먼저 로그인해주세요.
        </p>
      </div>
    )
  }

  if (!migrationStatus) {
    return (
      <div className="p-6 bg-surface rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-surface rounded-lg border border-gray-200">
      <h3 className="text-title mb-4">🔄 localStorage → Supabase 마이그레이션</h3>

      {/* 현재 상태 */}
      <div className="mb-6">
        <h4 className="text-body font-medium mb-2">현재 상태</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>마이그레이션 완료:</span>
            <span className={migrationStatus.isCompleted ? 'text-green-600' : 'text-gray-500'}>
              {migrationStatus.isCompleted ? '✅ 완료됨' : '❌ 미완료'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>localStorage 데이터:</span>
            <span className={migrationStatus.hasLocalData ? 'text-blue-600' : 'text-gray-500'}>
              글 {migrationStatus.localDataSummary.postsCount}개,
              사용자 {migrationStatus.localDataSummary.usersCount}개
            </span>
          </div>
        </div>
      </div>

      {/* 마이그레이션 버튼 */}
      {migrationStatus.hasLocalData && !migrationStatus.isCompleted && (
        <div className="mb-6">
          <button
            onClick={handleMigration}
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-gentle"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                마이그레이션 중...
              </div>
            ) : (
              '🚀 마이그레이션 시작'
            )}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            기존 localStorage 데이터를 Supabase로 이전합니다.
            이 작업은 안전하며 원본 데이터는 백업됩니다.
          </p>
        </div>
      )}

      {/* 마이그레이션 결과 */}
      {migrationResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-medium ${
              migrationResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {migrationResult.success ? '✅ 마이그레이션 성공' : '❌ 마이그레이션 실패'}
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showDetails ? '접기' : '자세히'}
            </button>
          </div>

          <div className="text-sm space-y-1">
            <div>마이그레이션된 글: {migrationResult.postsCount}개</div>
            {migrationResult.details && (
              <div className="text-gray-600">{migrationResult.details}</div>
            )}
          </div>

          {showDetails && migrationResult.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h5 className="text-xs font-medium text-gray-700 mb-1">오류 목록:</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                {migrationResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 완료 후 옵션 */}
      {migrationStatus.isCompleted && (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-sm text-green-800">
                마이그레이션이 완료되었습니다! 이제 Supabase를 사용합니다.
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCleanup}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-sm transition-gentle"
            >
              localStorage 정리
            </button>
            <button
              onClick={handleRestore}
              className="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 text-sm transition-gentle"
            >
              백업 복원
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            정리: 기존 localStorage 데이터 삭제 (백업 유지) |
            복원: 백업 데이터를 localStorage로 되돌리기
          </p>
        </div>
      )}

      {/* 데이터 없음 */}
      {!migrationStatus.hasLocalData && migrationStatus.isCompleted && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">🎉</div>
          <div className="text-sm">
            마이그레이션이 완료되었고 localStorage에 남은 데이터가 없습니다.
            <br />
            이제 Supabase를 사용하여 데이터를 안전하게 저장합니다.
          </div>
        </div>
      )}

      {!migrationStatus.hasLocalData && !migrationStatus.isCompleted && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">📝</div>
          <div className="text-sm">
            마이그레이션할 localStorage 데이터가 없습니다.
            <br />
            새로운 글을 작성하면 자동으로 Supabase에 저장됩니다.
          </div>
        </div>
      )}
    </div>
  )
}