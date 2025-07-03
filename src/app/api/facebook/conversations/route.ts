import { NextRequest, NextResponse } from 'next/server';
import { FacebookConversationModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const conversations = await FacebookConversationModel.getWithContactInfo(limit, offset);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching Facebook conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
