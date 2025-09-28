'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCallbackClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 클라이언트 사이드에서만 실행
        if (typeof window === 'undefined') {
          console.log('⏳ Server-side render, skipping OAuth callback');
          return;
        }

        console.log('🔄 Processing OAuth callback...');

        // OAuth 콜백 처리 - 안전한 클라이언트 초기화
        const supabaseClient = createCallbackClient()
        console.log('✅ Supabase callback client initialized');

        // URL에서 OAuth 토큰 처리
        const { data, error } = await supabaseClient.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setIsProcessing(false)
          router.push('/login?error=auth_failed')
          return
        }

        if (data.session) {
          console.log('OAuth login successful, user ID:', data.session.user.id)

          // 프로필 확인
          const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // 프로필이 없으면 생성
            console.log('Creating new profile for user:', data.session.user.id)
            const userMetadata = data.session.user.user_metadata
            const email = data.session.user.email || ''

            // 고유 username 생성
            let username = userMetadata.preferred_username ||
                          userMetadata.user_name ||
                          email.split('@')[0] ||
                          `user_${Date.now()}`

            // username 중복 체크 및 고유화
            const { data: existingUser } = await supabaseClient
              .from('profiles')
              .select('username')
              .eq('username', username)
              .single()

            if (existingUser) {
              username = `${username}_${Date.now()}`
            }

            const { error: insertError } = await supabaseClient
              .from('profiles')
              .insert({
                id: data.session.user.id,
                username: username,
                display_name: userMetadata.full_name || userMetadata.name || username,
                bio: '',
                avatar_url: userMetadata.avatar_url || userMetadata.picture,
                is_private: false,
                allow_follow: true
              })

            if (insertError) {
              console.error('Error creating profile:', insertError)
              setIsProcessing(false)
              router.push('/login?error=profile_creation_failed')
              return
            }

            console.log('Profile created successfully for username:', username)
          } else if (profileError) {
            console.error('Error fetching profile:', profileError)
            setIsProcessing(false)
            router.push('/login?error=profile_fetch_failed')
            return
          } else {
            console.log('Existing profile found:', profile.username)
          }

          // 짧은 지연 후 리다이렉트 (세션 동기화 시간 확보)
          setTimeout(() => {
            setIsProcessing(false)
            router.push('/')
          }, 1000)
        } else {
          console.log('No session found after OAuth callback')
          setIsProcessing(false)
          router.push('/login')
        }
      } catch (err) {
        console.error('Unexpected error in OAuth callback:', err)
        setIsProcessing(false)
        router.push('/login?error=unexpected')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-700">로그인 처리 중...</p>
          </>
        ) : (
          <p className="text-gray-700">리다이렉트 중...</p>
        )}
      </div>
    </div>
  )
}