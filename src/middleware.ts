import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerSupabaseClient();
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();
  
  // Auth routes - redirect to dashboard if already authenticated
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password')
  ) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // Protected routes - redirect to login if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
  
  // Public routes - allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Auth routes
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    // Protected routes
    '/dashboard/:path*',
  ],
};
