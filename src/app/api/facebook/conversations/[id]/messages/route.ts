import { NextRequest, NextResponse } from 'next/server';
import { FacebookMessageModel, FacebookConversationModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const conversationId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Verify conversation exists
    const conversation = await FacebookConversationModel.getById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await FacebookMessageModel.getByConversationId(conversationId, limit, offset);

    return NextResponse.json({ 
      conversation,
      messages: messages.reverse() // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Error fetching Facebook messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
