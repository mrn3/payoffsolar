import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(_request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);
    
    // Verify the reset token and get user ID
        
    if (!userId) {
      return NextResponse.json(
        { _error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Update the user's password
    const success = await updatePassword(_userId, validatedData.password);
    
    if (!success) {
      return NextResponse.json(
        { _error: 'Failed to update password' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (_error: unknown) {
    console.error('Reset password _error:', _error);
    return NextResponse.json(
      { _error: error instanceof Error ? _error.message : String(_error) || 'Failed to reset password' },
      { status: 400 }
    );
  }
}
