'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=auth_failed')
          return
        }

        if (data.session) {
          // OAuth 로그인 성공 시 프로필 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // 프로필이 없으면 생성
            const userMetadata = data.session.user.user_metadata
            const email = data.session.user.email || ''
            const username = userMetadata.preferred_username ||
                            userMetadata.user_name ||
                            email.split('@')[0] ||
                            `user_${Date.now()}`

            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                username: username,
                display_name: userMetadata.full_name || userMetadata.name || username,
                bio: '',
                avatar_url: userMetadata.avatar_url || userMetadata.picture
              })

            if (insertError) {
              console.error('Error creating profile:', insertError)
            }
          }

          router.push('/')
        } else {
          router.push('/login')
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        router.push('/login?error=unexpected')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-body">로그인 처리 중...</p>
      </div>
    </div>
  )
}