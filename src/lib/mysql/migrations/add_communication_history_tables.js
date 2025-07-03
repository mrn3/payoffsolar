/**
 * Migration: Add Communication History tables
 * Date: 2025-07-03
 * Description: Creates tables for storing email and SMS communication history
 */

const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Creating communication history tables...');
  
  // Create email_communications table
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
  console.log('✓ Created email_communications table');

  // Create sms_communications table
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
  console.log('✓ Created sms_communications table');

  console.log('✓ Communication history tables created successfully');
}

async function down(connection) {
  console.log('Removing communication history tables...');
  
  // Drop tables
  await connection.execute('DROP TABLE IF EXISTS sms_communications');
  console.log('✓ Dropped sms_communications table');
  
  await connection.execute('DROP TABLE IF EXISTS email_communications');
  console.log('✓ Dropped email_communications table');

  console.log('✓ Communication history tables removed successfully');
}

module.exports = { up, down };
