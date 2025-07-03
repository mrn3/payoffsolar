#!/usr/bin/env node

/**
 * Facebook Messages Import Script
 * 
 * This script fetches all existing conversations and messages from your Facebook Page
 * and imports them into the local database, creating contacts as needed.
 * 
 * Usage: node scripts/import-facebook-messages.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Facebook API helper functions
async function fetchFacebookAPI(endpoint, accessToken) {
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

async function fetchUserProfile(userId, accessToken) {
  try {
    return await fetchFacebookAPI(`${userId}?fields=name,profile_pic`, accessToken);
  } catch (error) {
    console.warn(`⚠️ Could not fetch profile for user ${userId}:`, error.message);
    return { name: `Facebook User ${userId}`, profile_pic: null };
  }
}

// Database helper functions
async function getOrCreateContact(connection, facebookUserId, userProfile) {
  // Check if contact already exists
  const [existingContacts] = await connection.execute(
    'SELECT * FROM contacts WHERE facebook_user_id = ?',
    [facebookUserId]
  );

  if (existingContacts.length > 0) {
    return existingContacts[0];
  }

  // Create new contact
  const contactId = generateUUID();
  await connection.execute(
    `INSERT INTO contacts (id, name, facebook_user_id, notes, created_at, updated_at) 
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [
      contactId,
      userProfile.name || `Facebook User ${facebookUserId}`,
      facebookUserId,
      'Created from Facebook Messenger import'
    ]
  );

  const [newContact] = await connection.execute(
    'SELECT * FROM contacts WHERE id = ?',
    [contactId]
  );

  return newContact[0];
}

async function getOrCreateConversation(connection, contactId, facebookUserId, pageId, userProfile) {
  // Check if conversation already exists
  const [existingConversations] = await connection.execute(
    'SELECT * FROM facebook_conversations WHERE facebook_user_id = ?',
    [facebookUserId]
  );

  if (existingConversations.length > 0) {
    return existingConversations[0];
  }

  // Create new conversation
  const conversationId = generateUUID();
  await connection.execute(
    `INSERT INTO facebook_conversations 
     (id, contact_id, facebook_user_id, facebook_page_id, conversation_id, user_name, user_profile_pic, last_message_time, is_active, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), TRUE, NOW(), NOW())`,
    [
      conversationId,
      contactId,
      facebookUserId,
      pageId,
      `${facebookUserId}_${pageId}`,
      userProfile.name || `Facebook User ${facebookUserId}`,
      userProfile.profile_pic || null
    ]
  );

  const [newConversation] = await connection.execute(
    'SELECT * FROM facebook_conversations WHERE id = ?',
    [conversationId]
  );

  return newConversation[0];
}

async function messageExists(connection, facebookMessageId) {
  const [existing] = await connection.execute(
    'SELECT id FROM facebook_messages WHERE facebook_message_id = ?',
    [facebookMessageId]
  );
  return existing.length > 0;
}

async function saveMessage(connection, conversationId, message, isFromPage = false) {
  if (await messageExists(connection, message.id)) {
    console.log(`   ⏭️ Message ${message.id} already exists, skipping`);
    return;
  }

  const messageId = generateUUID();
  const messageType = determineMessageType(message);
  
  await connection.execute(
    `INSERT INTO facebook_messages 
     (id, conversation_id, facebook_message_id, sender_id, recipient_id, message_text, message_type, attachments, is_from_page, timestamp, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      messageId,
      conversationId,
      message.id,
      message.from?.id || '',
      message.to?.data?.[0]?.id || '',
      message.message || '',
      messageType,
      message.attachments ? JSON.stringify(message.attachments) : null,
      isFromPage,
      new Date(message.created_time).getTime()
    ]
  );

  console.log(`   ✅ Saved message: ${message.message?.substring(0, 50) || '[attachment]'}...`);
}

function determineMessageType(message) {
  if (message.attachments?.data?.length > 0) {
    const attachment = message.attachments.data[0];
    if (attachment.type === 'image') return 'image';
    if (attachment.type === 'file') return 'file';
    return 'file';
  }
  return 'text';
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Main import function
async function importFacebookMessages() {
  console.log('🚀 Starting Facebook Messages import...');
  
  // Load environment variables
  loadEnvFile();
  
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN not found in environment variables');
  }

  // Database configuration
  const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  };

  console.log('🔧 Connecting to database...');
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Get page info
    console.log('📄 Fetching page information...');
    const pageInfo = await fetchFacebookAPI('me', accessToken);
    console.log(`✅ Connected to page: ${pageInfo.name} (ID: ${pageInfo.id})`);

    // Fetch conversations
    console.log('💬 Fetching conversations...');
    let conversationsUrl = 'me/conversations?fields=participants,updated_time&limit=100';
    let totalConversations = 0;
    let totalMessages = 0;

    while (conversationsUrl) {
      const conversationsData = await fetchFacebookAPI(conversationsUrl.replace('https://graph.facebook.com/v18.0/', ''), accessToken);
      
      for (const conversation of conversationsData.data || []) {
        console.log(`\n🔄 Processing conversation ${conversation.id}...`);
        
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
        const contact = await getOrCreateContact(connection, userParticipant.id, userProfile);
        console.log(`   📇 Contact: ${contact.name} (${contact.id})`);

        // Create or get conversation
        const dbConversation = await getOrCreateConversation(
          connection, 
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
          
          for (const message of messagesData.data || []) {
            const isFromPage = message.from?.id === pageInfo.id;
            await saveMessage(connection, dbConversation.id, message, isFromPage);
            conversationMessageCount++;
            totalMessages++;
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
          await connection.execute(
            'UPDATE facebook_conversations SET last_message_time = (SELECT FROM_UNIXTIME(MAX(timestamp)/1000) FROM facebook_messages WHERE conversation_id = ?) WHERE id = ?',
            [dbConversation.id, dbConversation.id]
          );
        }
      }

      conversationsUrl = conversationsData.paging?.next;
      if (conversationsUrl) {
        console.log('\n⏳ Fetching next page of conversations...');
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n🎉 Import completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Conversations processed: ${totalConversations}`);
    console.log(`   - Messages imported: ${totalMessages}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the import
if (require.main === module) {
  importFacebookMessages()
    .then(() => {
      console.log('✅ Import script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import script failed:', error);
      process.exit(1);
    });
}

module.exports = { importFacebookMessages };
