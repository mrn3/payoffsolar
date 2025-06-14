import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();
    return NextResponse.json({ profile: session.profile });
  } catch (_error) {
    console.error('Error fetching profile:', _error);
    return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
  }
}
