#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
  let connection;
  
  try {
    // Create connection using environment variables
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log(`Connected to MySQL as ${process.env.MYSQL_USER || 'root'}@${process.env.MYSQL_HOST || 'localhost'}`);
    
    // Create email_communications table
    console.log('Creating email_communications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_communications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        contact_id VARCHAR(36) NOT NULL,
        direction ENUM('inbound', 'outbound') NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        to_email VARCHAR(255) NOT NULL,
        cc_emails JSON,
        bcc_emails JSON,
        subject VARCHAR(500),
        body_text TEXT,
        body_html TEXT,
        message_id VARCHAR(255),
        thread_id VARCHAR(255),
        status ENUM('sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked') DEFAULT 'sent',
        sent_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
        INDEX idx_contact_id (contact_id),
        INDEX idx_sent_at (sent_at),
        INDEX idx_message_id (message_id),
        INDEX idx_thread_id (thread_id)
      )
    `);
    console.log('✅ email_communications table created');

    // Create sms_communications table
    console.log('Creating sms_communications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sms_communications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        contact_id VARCHAR(36) NOT NULL,
        direction ENUM('inbound', 'outbound') NOT NULL,
        from_phone VARCHAR(20) NOT NULL,
        to_phone VARCHAR(20) NOT NULL,
        message_text TEXT NOT NULL,
        status ENUM('sent', 'delivered', 'failed', 'undelivered') DEFAULT 'sent',
        provider VARCHAR(50),
        provider_message_id VARCHAR(255),
        sent_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
        INDEX idx_contact_id (contact_id),
        INDEX idx_sent_at (sent_at),
        INDEX idx_provider_message_id (provider_message_id)
      )
    `);
    console.log('✅ sms_communications table created');

    // Check if facebook tables exist, if not create them
    const [fbTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('facebook_conversations', 'facebook_messages')
    `, [process.env.MYSQL_DATABASE || 'payoffsolar']);
    
    if (!fbTables.some(t => t.TABLE_NAME === 'facebook_conversations')) {
      console.log('Creating facebook_conversations table...');
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
      console.log('✅ facebook_conversations table created');
    }
    
    if (!fbTables.some(t => t.TABLE_NAME === 'facebook_messages')) {
      console.log('Creating facebook_messages table...');
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
      console.log('✅ facebook_messages table created');
    }

    // Add facebook_user_id column to contacts table if it doesn't exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'contacts' 
      AND COLUMN_NAME = 'facebook_user_id'
    `, [process.env.MYSQL_DATABASE || 'payoffsolar']);
    
    if (columns.length === 0) {
      console.log('Adding facebook_user_id column to contacts table...');
      await connection.execute(`
        ALTER TABLE contacts 
        ADD COLUMN facebook_user_id VARCHAR(255) AFTER user_id,
        ADD INDEX idx_facebook_user_id (facebook_user_id)
      `);
      console.log('✅ facebook_user_id column added to contacts table');
    }

    console.log('\n🎉 All communication tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTables();
