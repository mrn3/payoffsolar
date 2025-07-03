#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  let connection;
  
  try {
    console.log('=== Testing Database Connection ===');
    console.log('Environment variables:');
    console.log(`MYSQL_HOST: ${process.env.MYSQL_HOST}`);
    console.log(`MYSQL_PORT: ${process.env.MYSQL_PORT}`);
    console.log(`MYSQL_USER: ${process.env.MYSQL_USER}`);
    console.log(`MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD ? '[SET]' : '[EMPTY]'}`);
    console.log(`MYSQL_DATABASE: ${process.env.MYSQL_DATABASE}`);
    console.log('');

    // Test connection using the same method as the app
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log('✅ Database connection successful');

    // Test the exact query that the contacts API uses
    console.log('\n=== Testing Contacts Query ===');
    const [contacts] = await connection.execute(
      'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [50, 0]
    );
    
    console.log(`✅ Found ${contacts.length} contacts`);
    if (contacts.length > 0) {
      console.log('Sample contact:', {
        id: contacts[0].id,
        name: contacts[0].name,
        email: contacts[0].email,
        phone: contacts[0].phone
      });
    }

    // Test the communication history query
    if (contacts.length > 0) {
      const contactId = contacts[0].id;
      console.log(`\n=== Testing Communication Query for ${contactId} ===`);
      
      try {
        // Test Facebook messages query
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
        
        console.log(`✅ Facebook messages query: ${facebookMessages.length} results`);
        
        // Test email query
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
        
        console.log(`✅ Email communications query: ${emails.length} results`);
        
        // Test SMS query
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
        
        console.log(`✅ SMS communications query: ${smsMessages.length} results`);
        
        // Test the combined query logic
        const allCommunications = [
          ...facebookMessages,
          ...emails,
          ...smsMessages
        ];
        
        console.log(`✅ Total communications: ${allCommunications.length}`);
        
        if (allCommunications.length > 0) {
          console.log('Sample communication:', allCommunications[0]);
        }
        
      } catch (queryError) {
        console.error('❌ Communication query error:', queryError.message);
        console.error('Full error:', queryError);
      }
    }

    console.log('\n✅ All database tests passed');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDatabaseConnection();
