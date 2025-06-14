import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  try {
    await clearAuthCookie();

    return NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    );
  } catch (_error: unknown) {
    console.error('Sign out _error:', _error);
    return NextResponse.json(
      { _error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}
