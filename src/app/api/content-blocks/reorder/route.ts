import { NextRequest, NextResponse } from 'next/server';
import { ContentBlockModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.contentId || !Array.isArray(data.blockIds)) {
      return NextResponse.json({ 
        error: 'Missing required fields: contentId, blockIds' 
      }, { status: 400 });
    }

    await ContentBlockModel.reorderBlocks(data.contentId, data.blockIds);
    return NextResponse.json({ message: 'Blocks reordered successfully' });
  } catch (error) {
    console.error('Error reordering content blocks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
