#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
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
    
    // Check if communication tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('email_communications', 'sms_communications', 'facebook_conversations', 'facebook_messages')
      ORDER BY TABLE_NAME
    `, [process.env.MYSQL_DATABASE || 'payoffsolar']);
    
    console.log('\n=== Communication Tables Status ===');
    const expectedTables = ['email_communications', 'sms_communications', 'facebook_conversations', 'facebook_messages'];
    
    for (const expectedTable of expectedTables) {
      const exists = tables.some(t => t.TABLE_NAME === expectedTable);
      console.log(`${expectedTable}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (exists) {
        // Check table structure
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [process.env.MYSQL_DATABASE || 'payoffsolar', expectedTable]);
        
        console.log(`  Columns (${columns.length}):`);
        columns.forEach(col => {
          console.log(`    - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        // Check row count
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${expectedTable}`);
        console.log(`  Rows: ${count[0].count}`);
      }
      console.log('');
    }
    
    // Test a sample query like the API would do
    console.log('=== Testing Communication History Query ===');
    try {
      const [contacts] = await connection.execute('SELECT id, name FROM contacts LIMIT 1');
      if (contacts.length > 0) {
        const contactId = contacts[0].id;
        console.log(`Testing with contact: ${contacts[0].name} (${contactId})`);
        
        // Test the same query the API uses
        const [facebookMessages] = await connection.execute(`
          SELECT 
            fm.id,
            'facebook' as type,
            fc.contact_id,
            CASE WHEN fm.is_from_page = 1 THEN 'outbound' ELSE 'inbound' END as direction,
            fm.message_text as content,
            NULL as subject,
            FROM_UNIXTIME(fm.timestamp / 1000) as timestamp,
            NULL as status,
            JSON_OBJECT(
              'facebook_message_id', fm.facebook_message_id,
              'message_type', fm.message_type,
              'attachments', fm.attachments,
              'conversation_id', fm.conversation_id
            ) as metadata
           FROM facebook_messages fm
           JOIN facebook_conversations fc ON fm.conversation_id = fc.id
           WHERE fc.contact_id = ?
        `, [contactId]);
        
        const [emails] = await connection.execute(`
          SELECT 
            id,
            'email' as type,
            contact_id,
            direction,
            COALESCE(body_text, body_html, '') as content,
            subject,
            sent_at as timestamp,
            status,
            JSON_OBJECT(
              'from_email', from_email,
              'to_email', to_email,
              'cc_emails', cc_emails,
              'bcc_emails', bcc_emails,
              'message_id', message_id,
              'thread_id', thread_id
            ) as metadata
           FROM email_communications
           WHERE contact_id = ?
        `, [contactId]);
        
        const [smsMessages] = await connection.execute(`
          SELECT 
            id,
            'sms' as type,
            contact_id,
            direction,
            message_text as content,
            NULL as subject,
            sent_at as timestamp,
            status,
            JSON_OBJECT(
              'from_phone', from_phone,
              'to_phone', to_phone,
              'provider', provider,
              'provider_message_id', provider_message_id
            ) as metadata
           FROM sms_communications
           WHERE contact_id = ?
        `, [contactId]);
        
        console.log(`Facebook messages: ${facebookMessages.length}`);
        console.log(`Email communications: ${emails.length}`);
        console.log(`SMS communications: ${smsMessages.length}`);
        
        if (facebookMessages.length > 0) {
          console.log('Sample Facebook message:', facebookMessages[0]);
        }
        if (emails.length > 0) {
          console.log('Sample email:', emails[0]);
        }
        if (smsMessages.length > 0) {
          console.log('Sample SMS:', smsMessages[0]);
        }
      } else {
        console.log('No contacts found to test with');
      }
    } catch (queryError) {
      console.error('❌ Error testing communication queries:', queryError.message);
    }
    
    console.log('\n✅ Table check completed');
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();
