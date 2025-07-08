// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // Block if not logged in and accessing protected routes
  if (!session && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    // Capture the current URL to redirect back after login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🔒 Admin-only route protection
  if (pathname.startsWith('/admin') && session) {
    const { data: userDetails } = await supabase.from('users').select('role').eq('id', session.user.id).single();

    if (userDetails?.role !== 'admin') {
      return NextResponse.redirect(new URL('/not-authorized', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 