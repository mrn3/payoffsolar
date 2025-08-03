import { NextRequest, NextResponse } from 'next/server';
import { BlockTypeModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const blockTypes = await BlockTypeModel.getAll();
    return NextResponse.json({ blockTypes });
  } catch (error) {
    console.error('Error fetching block types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
