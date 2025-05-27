import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signInSchema.parse(body);
    
    const session = await signIn(validatedData.email, validatedData.password);
    
    return NextResponse.json(
      { message: 'Signed in successfully', user: session.user },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign in' },
      { status: 401 }
    );
  }
}
