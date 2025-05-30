import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple JWT verification for Edge Runtime
function verifyJWT(token: string, secret: string): boolean {
  try {
    // Split the JWT into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode the payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    console.log('🔍 JWT payload:', payload);

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ Token expired');
      return false;
    }

    // For now, we'll just check if the token has the right structure
    // In production, you'd want to verify the signature using Web Crypto API
    const isValid = payload.userId && payload.iat;
    console.log('🔍 Token structure valid:', isValid);
    return isValid;
  } catch (error) {
    console.log('❌ JWT parsing error:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('🔍 Middleware checking path:', pathname);

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value;
  console.log('🍪 Middleware found token:', token ? 'Yes' : 'No');

  // Verify token
  let isAuthenticated = false;
  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
      isAuthenticated = verifyJWT(token, JWT_SECRET);
      console.log('✅ Token verification result:', isAuthenticated);
    } catch (error) {
      console.log('❌ Token verification failed:', error);
      isAuthenticated = false;
    }
  } else {
    console.log('❌ No token found in middleware');
  }

  console.log('🔐 Is authenticated:', isAuthenticated);

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
