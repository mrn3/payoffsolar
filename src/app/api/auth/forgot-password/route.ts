import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPassword } from '@/lib/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    await resetPassword(validatedData.email);

    return NextResponse.json(
      { message: 'Password reset instructions have been sent to your email.' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to send reset instructions' },
      { status: 400 }
    );
  }
}
