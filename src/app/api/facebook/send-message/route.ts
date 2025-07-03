import { NextRequest, NextResponse } from 'next/server';
import { FacebookConversationModel, FacebookMessageModel } from '@/lib/models';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
      return NextResponse.json({ error: 'Conversation ID and message are required' }, { status: 400 });
    }

    // Get conversation details
    const conversation = await FacebookConversationModel.getById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Send message via Facebook API
    const result = await sendFacebookMessage(conversation.facebook_user_id, message);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Store the sent message in our database
    const timestamp = Date.now();
    await FacebookMessageModel.create({
      conversation_id: conversationId,
      facebook_message_id: result.messageId,
      sender_id: conversation.facebook_page_id,
      recipient_id: conversation.facebook_user_id,
      message_text: message,
      message_type: 'text',
      attachments: null,
      is_from_page: true,
      timestamp: timestamp
    });

    // Update conversation last message time
    await FacebookConversationModel.updateLastMessageTime(
      conversationId,
      new Date(timestamp).toISOString()
    );

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Error sending Facebook message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendFacebookMessage(recipientId: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) {
      return { success: false, error: 'Facebook Page Access Token not configured' };
    }

    const response = await fetch('https://graph.facebook.com/v18.0/me/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        recipient: {
          id: recipientId
        },
        message: {
          text: message
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Facebook API error:', error);
      return { success: false, error: error.error?.message || 'Failed to send message' };
    }

    const result = await response.json();
    return { success: true, messageId: result.message_id };
  } catch (error) {
    console.error('Error calling Facebook API:', error);
    return { success: false, error: 'Failed to send message' };
  }
}
