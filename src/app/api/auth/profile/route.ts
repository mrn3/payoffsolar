import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    return NextResponse.json({ profile: session.profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
