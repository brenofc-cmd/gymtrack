import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const baseUrl = process.env.NODE_ENV === 'development'
    ? origin
    : `${forwardedProto ?? 'https'}://${forwardedHost ?? new URL(origin).host}`
  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null

  if (code) {
    const response = NextResponse.redirect(`${baseUrl}/`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      let destination = safeNext ?? '/'
      if (!safeNext && user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('onboarding_done')
          .eq('id', user.id)
          .maybeSingle()
        destination = preferences?.onboarding_done ? '/' : '/onboarding'
      }
      response.headers.set('location', `${baseUrl}${destination}`)
      return response
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=oauth_callback`)
}
