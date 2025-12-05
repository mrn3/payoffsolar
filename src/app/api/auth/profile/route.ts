import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { executeSingle, getOne } from '@/lib/mysql/connection';
import { z } from 'zod';
import { isValidPhoneNumber } from '@/lib/utils/phone';

export async function GET() {
  try {
	    const session = await requireAuth();
	    return NextResponse.json({ profile: session.profile });
	  } catch (error) {
	    console.error('Error fetching profile:', error);
	    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	  }
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || isValidPhoneNumber(value),
      { message: 'Please enter a valid phone number' }
    ),
});

interface DbProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role_name: string | null;
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Keep users.email and profiles.email in sync
    await executeSingle(
      'UPDATE users SET email = ? WHERE id = ?',
      [validated.email, session.user.id]
    );

    await executeSingle(
      'UPDATE profiles SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?',
      [
        validated.firstName,
        validated.lastName || null,
        validated.email,
        validated.phone || null,
        session.user.id,
      ]
    );

	    const updatedProfile = await getOne<DbProfileRow>(
      `SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.avatar_url, r.name as role_name
       FROM profiles p
       LEFT JOIN roles r ON p.role_id = r.id
       WHERE p.id = ?`,
      [session.user.id]
    );

    if (!updatedProfile) {
      throw new Error('Failed to load updated profile');
    }

    return NextResponse.json({
      profile: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        phone: updatedProfile.phone,
        avatar_url: updatedProfile.avatar_url,
        role: updatedProfile.role_name,
      },
    });
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 400 }
    );
  }
}
