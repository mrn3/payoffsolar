import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/auth';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);

    const session = await signUp(
      validatedData.email,
      validatedData.password,
      validatedData.firstName,
      validatedData.lastName
    );

    return NextResponse.json(
      { message: 'Account created successfully', user: session.user },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to create account' },
      { status: 400 }
    );
  }
}
