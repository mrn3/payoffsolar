import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FacebookConversationModel, FacebookMessageModel, ContactModel } from '@/lib/models';

// Facebook Messenger webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;

  if (!VERIFY_TOKEN) {
    console.error('FACEBOOK_VERIFY_TOKEN not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Facebook webhook verified successfully');
    return new NextResponse(challenge);
  }

  console.error('Facebook webhook verification failed');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// Facebook Messenger webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    console.log('🔔 Facebook webhook POST received');
    console.log('📝 Headers:', Object.fromEntries(request.headers.entries()));
    console.log('📦 Body length:', body.length);

    // Verify webhook signature
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    if (!APP_SECRET) {
      console.error('❌ FACEBOOK_APP_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (!signature) {
      console.error('❌ Missing Facebook webhook signature');
      console.log('📋 Available headers:', Object.keys(Object.fromEntries(request.headers.entries())));
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', APP_SECRET)
      .update(body)
      .digest('hex');

    console.log('🔐 Signature verification:');
    console.log('   Received:', signature);
    console.log('   Expected:', expectedSignature);

    if (signature !== expectedSignature) {
      console.error('❌ Invalid Facebook webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const data = JSON.parse(body);
    console.log('✅ Facebook webhook data received:', JSON.stringify(data, null, 2));

    // Process webhook events
    if (data.object === 'page') {
      for (const entry of data.entry) {
        if (entry.messaging) {
          for (const messagingEvent of entry.messaging) {
            await handleMessagingEvent(messagingEvent, entry.id);
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Facebook webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleMessagingEvent(event: any, pageId: string) {
  try {
    console.log('Processing messaging event:', JSON.stringify(event, null, 2));

    // Handle incoming messages
    if (event.message && !event.message.is_echo) {
      await handleIncomingMessage(event, pageId);
    }

    // Handle message deliveries
    if (event.delivery) {
      console.log('Message delivery confirmed:', event.delivery);
    }

    // Handle message reads
    if (event.read) {
      console.log('Message read confirmed:', event.read);
    }

    // Handle postbacks (button clicks, etc.)
    if (event.postback) {
      await handlePostback(event, pageId);
    }
  } catch (error) {
    console.error('Error handling messaging event:', error);
  }
}

async function handleIncomingMessage(event: any, pageId: string) {
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;
  const messageId = event.message.mid;
  const messageText = event.message.text;
  const timestamp = event.timestamp;
  const attachments = event.message.attachments;

  console.log(`Incoming message from ${senderId}: ${messageText}`);

  try {
    // Get or create contact
    let contact = await ContactModel.getByFacebookUserId(senderId);
    
    if (!contact) {
      // Fetch user profile from Facebook
      const userProfile = await fetchFacebookUserProfile(senderId);
      
      // Create new contact
      const contactId = await ContactModel.createFromFacebook({
        name: userProfile.name || `Facebook User ${senderId}`,
        facebook_user_id: senderId,
        notes: 'Created from Facebook Messenger conversation'
      });
      
      contact = await ContactModel.getById(contactId);
    }

    if (!contact) {
      console.error('Failed to create or find contact for Facebook user:', senderId);
      return;
    }

    // Get or create conversation
    let conversation = await FacebookConversationModel.getByFacebookUserId(senderId);
    
    if (!conversation) {
      const userProfile = await fetchFacebookUserProfile(senderId);
      
      const conversationId = await FacebookConversationModel.create({
        contact_id: contact.id,
        facebook_user_id: senderId,
        facebook_page_id: pageId,
        conversation_id: `${senderId}_${pageId}`,
        user_name: userProfile.name || `Facebook User ${senderId}`,
        user_profile_pic: userProfile.profile_pic,
        last_message_time: new Date(timestamp).toISOString(),
        is_active: true
      });
      
      conversation = await FacebookConversationModel.getById(conversationId);
    }

    if (!conversation) {
      console.error('Failed to create or find conversation for Facebook user:', senderId);
      return;
    }

    // Check if message already exists (prevent duplicates)
    const existingMessage = await FacebookMessageModel.getByFacebookMessageId(messageId);
    if (existingMessage) {
      console.log('Message already exists, skipping:', messageId);
      return;
    }

    // Determine message type
    let messageType: 'text' | 'image' | 'file' | 'sticker' | 'quick_reply' | 'postback' = 'text';
    if (attachments && attachments.length > 0) {
      const attachment = attachments[0];
      if (attachment.type === 'image') messageType = 'image';
      else if (attachment.type === 'file') messageType = 'file';
      else if (attachment.type === 'template') messageType = 'quick_reply';
    }

    // Store the message
    await FacebookMessageModel.create({
      conversation_id: conversation.id,
      facebook_message_id: messageId,
      sender_id: senderId,
      recipient_id: recipientId,
      message_text: messageText,
      message_type: messageType,
      attachments: attachments,
      is_from_page: false,
      timestamp: timestamp
    });

    // Update conversation last message time
    await FacebookConversationModel.updateLastMessageTime(
      conversation.id,
      new Date(timestamp).toISOString()
    );

    console.log('Message stored successfully for conversation:', conversation.id);
  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

async function handlePostback(event: any, pageId: string) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;
  const title = event.postback.title;
  
  console.log(`Postback from ${senderId}: ${title} (${payload})`);
  
  // Handle postback as a special message type
  await handleIncomingMessage({
    ...event,
    message: {
      mid: `postback_${event.timestamp}`,
      text: `[Postback] ${title}`,
      attachments: null
    }
  }, pageId);
}

async function fetchFacebookUserProfile(userId: string): Promise<{ name?: string; profile_pic?: string }> {
  try {
    const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) {
      console.error('FACEBOOK_PAGE_ACCESS_TOKEN not configured');
      return {};
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${userId}?fields=name,profile_pic&access_token=${ACCESS_TOKEN}`
    );

    if (!response.ok) {
      console.error('Failed to fetch Facebook user profile:', response.status);
      return {};
    }

    const profile = await response.json();
    return {
      name: profile.name,
      profile_pic: profile.profile_pic
    };
  } catch (error) {
    console.error('Error fetching Facebook user profile:', error);
    return {};
  }
}
