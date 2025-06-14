import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPassword } from '@/lib/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(_request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);
    
    await resetPassword(validatedData.email);
    
    return NextResponse.json(
      { message: 'Password reset instructions have been sent to your email.' },
      { status: 200 }
    );
  } catch (_error: unknown) {
    console.error('Forgot password _error:', _error);
    return NextResponse.json(
      { _error: error instanceof Error ? _error.message : String(_error) || 'Failed to send reset instructions' },
      { status: 400 }
    );
  }
}
