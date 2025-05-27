import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value;

  // Verify token
  let isAuthenticated = false;
  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      jwt.verify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (error) {
      // Token is invalid
      isAuthenticated = false;
    }
  }

  // Auth routes - redirect to dashboard if already authenticated
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password')
  ) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - redirect to login if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
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
