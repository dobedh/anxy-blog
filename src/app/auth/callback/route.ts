import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  logger.debug({
    context: 'oauthCallback',
    metadata: {
      hasCode: !!code,
      next,
      origin: requestUrl.origin,
      pathname: requestUrl.pathname
    }
  })

  if (code) {
    // 서버 사이드 Supabase 클라이언트 사용 (쿠키 핸들링 지원)
    const supabase = createSupabaseServerClient()

    try {
      // OAuth 코드를 세션으로 교환
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        logger.error({
          context: 'oauthCallback',
          error,
          metadata: {
            step: 'exchange_code_for_session',
            errorCode: (error as any).code,
            errorStatus: (error as any).status,
            errorMessage: error.message,
            errorName: error.name
          }
        })
        return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin))
      }

      if (data.session) {
        logger.debug({
          context: 'oauthCallback',
          metadata: { userId: data.session.user.id, step: 'session_created' }
        })

        // 프로필 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle()

        if (!profile && !profileError) {
          // 프로필이 없으면 생성
          logger.debug({
            context: 'oauthCallback',
            metadata: { userId: data.session.user.id, step: 'creating_profile' }
          })

          const userMetadata = data.session.user.user_metadata
          const email = data.session.user.email || ''

          let username = userMetadata.preferred_username ||
                        userMetadata.user_name ||
                        email.split('@')[0] ||
                        `user_${Date.now()}`

          // username 중복 체크
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle()

          if (existingUser) {
            username = `${username}_${Date.now()}`
          }

          const { error: insertError } = await supabase.from('profiles').insert({
            id: data.session.user.id,
            username: username,
            display_name: userMetadata.full_name || userMetadata.name || username,
            bio: '',
            avatar_url: userMetadata.avatar_url || userMetadata.picture,
            is_private: false,
            allow_follow: true
          })

          if (insertError) {
            logger.error({
              context: 'oauthCallback',
              error: insertError,
              metadata: { userId: data.session.user.id, step: 'profile_creation_failed' }
            })
            return NextResponse.redirect(new URL('/?error=profile_creation_failed', requestUrl.origin))
          }

          logger.debug({
            context: 'oauthCallback',
            metadata: { username, step: 'profile_created' }
          })
        } else if (profileError) {
          logger.error({
            context: 'oauthCallback',
            error: profileError,
            metadata: { userId: data.session.user.id, step: 'profile_fetch_error' }
          })
          return NextResponse.redirect(new URL('/?error=profile_fetch_failed', requestUrl.origin))
        } else {
          logger.debug({
            context: 'oauthCallback',
            metadata: { username: profile.username, step: 'existing_profile_found' }
          })
        }
      }
    } catch (err) {
      logger.error({
        context: 'oauthCallback',
        error: err,
        metadata: { step: 'unexpected_error' }
      })
      return NextResponse.redirect(new URL('/?error=callback_error', requestUrl.origin))
    }
  }

  // 홈으로 리다이렉트 (쿠키에 세션 자동 저장됨)
  logger.debug({
    context: 'oauthCallback',
    metadata: { step: 'redirecting_home' }
  })

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
