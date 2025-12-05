import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, updatePassword, verifyPassword } from '@/lib/auth';
import { getOne } from '@/lib/mysql/connection';
import { z } from 'zod';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmNewPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    // Load current password hash
    const user = await getOne<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = ? ',
      [session.user.id]
    );

    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentValid = await verifyPassword(validated.currentPassword, user.password_hash);

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const updated = await updatePassword(session.user.id, validated.newPassword);

    if (!updated) {
      throw new Error('Failed to update password');
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: unknown) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change password' },
      { status: 400 }
    );
  }
}

