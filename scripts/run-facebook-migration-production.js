#!/usr/bin/env node

/**
 * Production Facebook Migration Runner
 * 
 * This script runs the Facebook Messenger database migration on your production server.
 * 
 * Usage:
 * 1. Upload this file to your production server
 * 2. Run: node run-facebook-migration-production.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if it exists
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
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

// Migration functions
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

async function runMigration() {
  console.log('🔄 Running Facebook Messenger migration on production...');
  
  // Load environment variables
  loadEnvFile();
  
  // Database configuration
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  };

  console.log('🔧 Database config:', {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password ? '***' : 'NOT SET',
    database: config.database
  });

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');
    
    await up(connection);
    console.log('✅ Facebook Messenger migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
