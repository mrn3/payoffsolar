/**
 * Migration: Add Facebook Messenger integration tables
 * Date: 2025-07-03
 * Description: Creates tables for storing Facebook Messenger conversations and messages
 */

const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Creating Facebook Messenger integration tables...');
  
  // Create facebook_conversations table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS facebook_conversations (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      contact_id VARCHAR(36) NOT NULL,
      facebook_user_id VARCHAR(255) NOT NULL UNIQUE,
      facebook_page_id VARCHAR(255) NOT NULL,
      conversation_id VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_profile_pic VARCHAR(500),
      last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      INDEX idx_facebook_user_id (facebook_user_id),
      INDEX idx_contact_id (contact_id),
      INDEX idx_conversation_id (conversation_id)
    )
  `);
  console.log('✓ Created facebook_conversations table');

  // Create facebook_messages table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS facebook_messages (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      conversation_id VARCHAR(36) NOT NULL,
      facebook_message_id VARCHAR(255) NOT NULL UNIQUE,
      sender_id VARCHAR(255) NOT NULL,
      recipient_id VARCHAR(255) NOT NULL,
      message_text TEXT,
      message_type ENUM('text', 'image', 'file', 'sticker', 'quick_reply', 'postback') DEFAULT 'text',
      attachments JSON,
      is_from_page BOOLEAN DEFAULT FALSE,
      timestamp BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES facebook_conversations(id) ON DELETE CASCADE,
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_facebook_message_id (facebook_message_id),
      INDEX idx_timestamp (timestamp)
    )
  `);
  console.log('✓ Created facebook_messages table');

  // Add facebook_user_id column to contacts table if it doesn't exist
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'contacts' 
    AND COLUMN_NAME = 'facebook_user_id'
  `);
  
  if (columns.length === 0) {
    await connection.execute(`
      ALTER TABLE contacts 
      ADD COLUMN facebook_user_id VARCHAR(255) AFTER user_id,
      ADD INDEX idx_facebook_user_id (facebook_user_id)
    `);
    console.log('✓ Added facebook_user_id column to contacts table');
  } else {
    console.log('✓ facebook_user_id column already exists in contacts table');
  }

  console.log('✓ Facebook Messenger integration tables created successfully');
}

async function down(connection) {
  console.log('Removing Facebook Messenger integration tables...');
  
  // Drop tables in reverse order due to foreign key constraints
  await connection.execute('DROP TABLE IF EXISTS facebook_messages');
  console.log('✓ Dropped facebook_messages table');
  
  await connection.execute('DROP TABLE IF EXISTS facebook_conversations');
  console.log('✓ Dropped facebook_conversations table');
  
  // Remove facebook_user_id column from contacts table
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'contacts' 
    AND COLUMN_NAME = 'facebook_user_id'
  `);
  
  if (columns.length > 0) {
    await connection.execute(`
      ALTER TABLE contacts 
      DROP INDEX idx_facebook_user_id,
      DROP COLUMN facebook_user_id
    `);
    console.log('✓ Removed facebook_user_id column from contacts table');
  } else {
    console.log('✓ facebook_user_id column does not exist in contacts table');
  }

  console.log('✓ Facebook Messenger integration tables removed successfully');
}

module.exports = { up, down };
