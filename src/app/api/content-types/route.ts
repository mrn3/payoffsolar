import { NextRequest, NextResponse } from 'next/server';
import { ContentTypeModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const contentTypes = await ContentTypeModel.getAll();
    return NextResponse.json({ contentTypes });
  } catch (error) {
    console.error('Error fetching content types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
