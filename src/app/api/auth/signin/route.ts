import { NextRequest, NextResponse } from 'next/server';
import { signIn, generateToken, generateCookieString } from '@/lib/auth';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 API Sign in request received');
    console.log('Environment check:', {
      MYSQL_HOST: process.env.MYSQL_HOST,
      MYSQL_USER: process.env.MYSQL_USER,
      MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ? '***' : 'NOT SET',
      MYSQL_DATABASE: process.env.MYSQL_DATABASE
    });

    const body = await request.json();
    console.log('📧 Sign in attempt for email:', body.email);

    const validatedData = signInSchema.parse(body);

    const session = await signIn(validatedData.email, validatedData.password);
    console.log('✅ Session created successfully:', session.user.email);

    // Generate a new token and set it manually in the response
    const token = generateToken(session.user.id);
    const cookieString = generateCookieString(token);
    console.log('🍪 Generated cookie string:', cookieString);

    const response = NextResponse.json(
      { message: 'Signed in successfully', user: session.user },
      { status: 200 }
    );

    // Manually set the cookie in the response headers
    response.headers.set('Set-Cookie', cookieString);
    console.log('🍪 Cookie set in response headers');

    return response;
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign in' },
      { status: 401 }
    );
  }
}
