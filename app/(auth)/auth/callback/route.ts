// app/auth/callback/route.ts
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  const supabase = createRouteHandlerClient({ cookies })

  if (!code) {
    // No code = redirect to home
    return NextResponse.redirect(requestUrl.origin)
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth session exchange failed:', error.message)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/auth-code-error`
    )
  }

  // Get user role to determine redirect
  const { data: { session } } = await supabase.auth.getSession()
  let redirectPath = next

  if (session?.user) {
    const { data: userInfo } = await supabase.from('users').select('role').eq('id', session.user.id).single()
    
    // Admins always go to /admin
    if (userInfo?.role === 'admin') {
      redirectPath = '/admin'
    }
  }

  // Always use the current request origin for redirects to avoid environment issues
  const finalRedirectUrl = `${requestUrl.origin}${redirectPath}`

  return NextResponse.redirect(finalRedirectUrl)
} 