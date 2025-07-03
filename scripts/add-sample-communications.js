#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function addSampleCommunications() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'payoffsolar'
    });

    console.log('Connected to MySQL database');
    
    // Get a sample contact
    const [contacts] = await connection.execute('SELECT id, name FROM contacts LIMIT 1');
    
    if (contacts.length === 0) {
      console.log('No contacts found. Please create a contact first.');
      return;
    }
    
    const contact = contacts[0];
    console.log(`Adding sample communications for contact: ${contact.name} (${contact.id})`);
    
    // Add sample email communications
    await connection.execute(`
      INSERT INTO email_communications (
        contact_id, direction, from_email, to_email, subject, body_text, status, sent_at
      ) VALUES 
      (?, 'inbound', 'customer@example.com', 'matt@payoffsolar.com', 'Inquiry about solar panels', 'Hi, I am interested in learning more about your solar panel options. Could you please send me some information?', 'delivered', DATE_SUB(NOW(), INTERVAL 2 DAY)),
      (?, 'outbound', 'matt@payoffsolar.com', 'customer@example.com', 'Re: Inquiry about solar panels', 'Thank you for your interest! I have attached our latest catalog with pricing information. Please let me know if you have any questions.', 'opened', DATE_SUB(NOW(), INTERVAL 1 DAY)),
      (?, 'inbound', 'customer@example.com', 'matt@payoffsolar.com', 'Follow-up questions', 'Thanks for the catalog! I have a few questions about the installation process and warranty options.', 'delivered', DATE_SUB(NOW(), INTERVAL 6 HOUR))
    `, [contact.id, contact.id, contact.id]);
    
    console.log('✓ Added sample email communications');
    
    // Add sample SMS communications
    await connection.execute(`
      INSERT INTO sms_communications (
        contact_id, direction, from_phone, to_phone, message_text, status, sent_at
      ) VALUES 
      (?, 'outbound', '+18014486396', '+15551234567', 'Hi! This is Matt from Payoff Solar. Thanks for your interest in our solar solutions. When would be a good time to schedule a consultation?', 'delivered', DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (?, 'inbound', '+15551234567', '+18014486396', 'Hi Matt! Thanks for reaching out. I am available this weekend for a consultation. What times work for you?', 'delivered', DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (?, 'outbound', '+18014486396', '+15551234567', 'Perfect! How about Saturday at 2 PM? I can come to your location to assess your property and discuss options.', 'delivered', DATE_SUB(NOW(), INTERVAL 2 DAY)),
      (?, 'inbound', '+15551234567', '+18014486396', 'Saturday at 2 PM works great! My address is 123 Main St, Salt Lake City, UT 84101. Looking forward to meeting you!', 'delivered', DATE_SUB(NOW(), INTERVAL 2 DAY))
    `, [contact.id, contact.id, contact.id, contact.id]);
    
    console.log('✓ Added sample SMS communications');
    
    // Check if there are any Facebook conversations for this contact
    const [fbConversations] = await connection.execute(
      'SELECT id FROM facebook_conversations WHERE contact_id = ? LIMIT 1',
      [contact.id]
    );
    
    if (fbConversations.length > 0) {
      const conversationId = fbConversations[0].id;
      
      // Add sample Facebook messages
      await connection.execute(`
        INSERT INTO facebook_messages (
          conversation_id, facebook_message_id, sender_id, recipient_id, message_text, message_type, is_from_page, timestamp
        ) VALUES 
        (?, 'fb_msg_1', 'customer_fb_id', 'page_fb_id', 'Hi! I saw your solar panel listing on Facebook Marketplace. Are these still available?', 'text', 0, ?),
        (?, 'fb_msg_2', 'page_fb_id', 'customer_fb_id', 'Yes, they are still available! We have several models in stock. What size system are you looking for?', 'text', 1, ?),
        (?, 'fb_msg_3', 'customer_fb_id', 'page_fb_id', 'I have a 2000 sq ft home and want to offset about 80% of my electricity usage. What would you recommend?', 'text', 0, ?)
      `, [
        conversationId, Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
        conversationId, Date.now() - (3 * 24 * 60 * 60 * 1000) + 300000, // 3 days ago + 5 minutes
        conversationId, Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 days ago
      ]);
      
      console.log('✓ Added sample Facebook messages');
    } else {
      console.log('ℹ No Facebook conversations found for this contact, skipping Facebook messages');
    }
    
    console.log('✓ Sample communication data added successfully!');
    console.log(`Visit http://localhost:3000/dashboard/contacts/${contact.id} to see the communication history`);
    
  } catch (error) {
    console.error('Error adding sample communications:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSampleCommunications();
