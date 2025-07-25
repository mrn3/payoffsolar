import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAdmin } from '@/lib/auth';
import { executeQuery, executeSingle, getOne } from '@/lib/mysql/connection';
import { ContactModel, FacebookConversationModel, FacebookMessageModel } from '@/lib/models';

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

    console.log('🚀 Starting Facebook Messages import via API...');

    // Get page info
    const pageInfo = await fetchFacebookAPI('me', accessToken);
    console.log(`✅ Connected to page: ${pageInfo.name} (ID: ${pageInfo.id})`);

    let totalConversations = 0;
    let totalMessages = 0;
    let errors: string[] = [];

    // Fetch conversations
    let conversationsUrl = 'me/conversations?fields=participants,updated_time&limit=50';

    while (conversationsUrl) {
      try {
        const conversationsData = await fetchFacebookAPI(conversationsUrl.replace('https://graph.facebook.com/v18.0/', ''), accessToken);
        console.log(`📊 Found ${conversationsData.data?.length || 0} conversations in this page`);

        for (const conversation of conversationsData.data || []) {
          try {
            console.log(`🔄 Processing conversation ${conversation.id}...`);
            
            // Find the user participant (not the page)
            const userParticipant = conversation.participants?.data?.find(p => p.id !== pageInfo.id);
            if (!userParticipant) {
              console.log('   ⏭️ No user participant found, skipping');
              continue;
            }

            // Get user profile
            const userProfile = await fetchUserProfile(userParticipant.id, accessToken);
            console.log(`   👤 User: ${userProfile.name} (${userParticipant.id})`);

            // Create or get contact
            const contact = await getOrCreateContact(userParticipant.id, userProfile);
            console.log(`   📇 Contact: ${contact.name} (${contact.id})`);

            // Create or get conversation
            const dbConversation = await getOrCreateConversation(
              contact.id, 
              userParticipant.id, 
              pageInfo.id, 
              userProfile
            );
            console.log(`   💬 Conversation: ${dbConversation.id}`);

            // Fetch messages for this conversation
            let messagesUrl = `${conversation.id}/messages?fields=id,from,to,message,created_time,attachments&limit=100`;
            let conversationMessageCount = 0;

            while (messagesUrl) {
              const messagesData = await fetchFacebookAPI(messagesUrl.replace('https://graph.facebook.com/v18.0/', ''), accessToken);
              console.log(`   📨 Found ${messagesData.data?.length || 0} messages in this page`);

              for (const message of messagesData.data || []) {
                try {
                  const isFromPage = message.from?.id === pageInfo.id;
                  await saveMessage(dbConversation.id, message, isFromPage);
                  conversationMessageCount++;
                  totalMessages++;
                } catch (messageError) {
                  console.error(`Error saving message ${message.id}:`, messageError);
                  errors.push(`Message ${message.id}: ${messageError instanceof Error ? messageError.message : 'Unknown error'}`);
                }
              }

              messagesUrl = messagesData.paging?.next;
              if (messagesUrl) {
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }

            console.log(`   📊 Imported ${conversationMessageCount} messages for this conversation`);
            totalConversations++;

            // Update conversation last message time
            if (conversationMessageCount > 0) {
              await executeSingle(
                'UPDATE facebook_conversations SET last_message_time = (SELECT FROM_UNIXTIME(MAX(timestamp)/1000) FROM facebook_messages WHERE conversation_id = ?) WHERE id = ?',
                [dbConversation.id, dbConversation.id]
              );
            }

          } catch (conversationError) {
            console.error(`Error processing conversation ${conversation.id}:`, conversationError);
            errors.push(`Conversation ${conversation.id}: ${conversationError instanceof Error ? conversationError.message : 'Unknown error'}`);
          }
        }

        conversationsUrl = conversationsData.paging?.next;
        if (conversationsUrl) {
          console.log('⏳ Fetching next page of conversations...');
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (pageError) {
        console.error('Error fetching conversations page:', pageError);
        errors.push(`Page fetch error: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
        break;
      }
    }

    console.log('🎉 Import completed!');
    console.log(`📊 Summary: ${totalConversations} conversations, ${totalMessages} messages`);

    return NextResponse.json({
      success: true,
      summary: {
        conversations: totalConversations,
        messages: totalMessages,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Facebook import failed:', error);
    return NextResponse.json({ 
      error: 'Import failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Helper functions
async function fetchFacebookAPI(endpoint: string, accessToken: string) {
  const url = `https://graph.facebook.com/v18.0/${endpoint}`;
  console.log(`📡 Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Facebook API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function fetchUserProfile(userId: string, accessToken: string) {
  try {
    return await fetchFacebookAPI(`${userId}?fields=name,profile_pic`, accessToken);
  } catch (error) {
    console.warn(`⚠️ Could not fetch profile for user ${userId}:`, error instanceof Error ? error.message : 'Unknown error');
    return { name: `Facebook User ${userId}`, profile_pic: null };
  }
}

async function getOrCreateContact(facebookUserId: string, userProfile: any) {
  // Check if contact already exists
  let contact = await ContactModel.getByFacebookUserId(facebookUserId);
  
  if (!contact) {
    // Create new contact
    const contactId = await ContactModel.createFromFacebook({
      name: userProfile.name || `Facebook User ${facebookUserId}`,
      facebook_user_id: facebookUserId,
      notes: 'Created from Facebook Messenger import'
    });
    
    contact = await ContactModel.getById(contactId);
  }

  return contact;
}

async function getOrCreateConversation(contactId: string, facebookUserId: string, pageId: string, userProfile: any) {
  // Check if conversation already exists
  let conversation = await FacebookConversationModel.getByFacebookUserId(facebookUserId);
  
  if (!conversation) {
    // Create new conversation
    const conversationId = await FacebookConversationModel.create({
      contact_id: contactId,
      facebook_user_id: facebookUserId,
      facebook_page_id: pageId,
      conversation_id: `${facebookUserId}_${pageId}`,
      user_name: userProfile.name || `Facebook User ${facebookUserId}`,
      user_profile_pic: userProfile.profile_pic || null,
      last_message_time: new Date().toISOString(),
      is_active: true
    });
    
    conversation = await FacebookConversationModel.getById(conversationId);
  }

  return conversation;
}

async function messageExists(facebookMessageId: string): Promise<boolean> {
  const existing = await FacebookMessageModel.getByFacebookMessageId(facebookMessageId);
  return !!existing;
}

async function saveMessage(conversationId: string, message: any, isFromPage: boolean = false) {
  if (await messageExists(message.id)) {
    console.log(`   ⏭️ Message ${message.id} already exists, skipping`);
    return;
  }

  const messageType = determineMessageType(message);
  
  await FacebookMessageModel.create({
    conversation_id: conversationId,
    facebook_message_id: message.id,
    sender_id: message.from?.id || '',
    recipient_id: message.to?.data?.[0]?.id || '',
    message_text: message.message || '',
    message_type: messageType,
    attachments: message.attachments ? message.attachments : null,
    is_from_page: isFromPage,
    timestamp: new Date(message.created_time).getTime()
  });

  console.log(`   ✅ Saved message: ${message.message?.substring(0, 50) || '[attachment]'}...`);
}

function determineMessageType(message: any): 'text' | 'image' | 'file' | 'sticker' | 'quick_reply' | 'postback' {
  if (message.attachments?.data?.length > 0) {
    const attachment = message.attachments.data[0];
    if (attachment.type === 'image') return 'image';
    if (attachment.type === 'file') return 'file';
    return 'file';
  }
  return 'text';
}
