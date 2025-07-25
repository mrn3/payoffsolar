import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'Facebook Page Access Token not configured' }, { status: 500 });
    }

    console.log('🔍 Testing Facebook API connection...');

    // Test 1: Get page info
    const pageResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
    const pageData = await pageResponse.json();
    
    if (pageData.error) {
      console.error('❌ Page access failed:', pageData.error);
      return NextResponse.json({ 
        error: 'Failed to access Facebook page', 
        details: pageData.error 
      }, { status: 400 });
    }

    console.log(`✅ Connected to page: ${pageData.name} (ID: ${pageData.id})`);

    // Test 2: Get conversations
    const conversationsResponse = await fetch(`https://graph.facebook.com/v18.0/me/conversations?fields=participants,updated_time&limit=50&access_token=${accessToken}`);
    const conversationsData = await conversationsResponse.json();
    
    if (conversationsData.error) {
      console.error('❌ Conversations access failed:', conversationsData.error);
      return NextResponse.json({ 
        error: 'Failed to access conversations', 
        details: conversationsData.error 
      }, { status: 400 });
    }

    const conversationCount = conversationsData.data?.length || 0;
    console.log(`📊 Found ${conversationCount} conversations`);

    // Test 3: Check if we can access messages from first conversation (if any)
    let messageTestResult = null;
    if (conversationCount > 0) {
      const firstConversation = conversationsData.data[0];
      const messagesResponse = await fetch(`https://graph.facebook.com/v18.0/${firstConversation.id}/messages?fields=id,from,to,message,created_time&limit=5&access_token=${accessToken}`);
      const messagesData = await messagesResponse.json();
      
      if (messagesData.error) {
        messageTestResult = `Error accessing messages: ${messagesData.error.message}`;
      } else {
        messageTestResult = `Successfully accessed ${messagesData.data?.length || 0} messages from first conversation`;
      }
    }

    return NextResponse.json({
      success: true,
      pageName: pageData.name,
      pageId: pageData.id,
      conversationCount,
      messageTestResult,
      details: {
        pageData,
        conversationsData,
        accessTokenConfigured: !!accessToken,
        accessTokenLength: accessToken.length
      }
    });

  } catch (error) {
    console.error('❌ Facebook connection test failed:', error);
    return NextResponse.json({ 
      error: 'Connection test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
