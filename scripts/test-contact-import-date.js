const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testContactImportWithDate() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log('Connected to database');

    // Test 1: Create contact with custom created_at date
    console.log('\n🧪 Test 1: Creating contact with custom created_at date...');
    
    const testContactId = require('crypto').randomUUID();
    const customDate = '2023-01-15';
    
    await connection.execute(
      'INSERT INTO contacts (id, name, email, phone, address, city, state, zip, notes, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [testContactId, 'Test Contact with Date', 'test-date@example.com', '555-123-4567', '123 Test St', 'Salt Lake City', 'UT', '84101', 'Test contact with custom date', null, customDate]
    );

    // Verify the contact was created with the correct date
    const [createdContact] = await connection.execute(
      'SELECT id, name, created_at FROM contacts WHERE id = ?',
      [testContactId]
    );

    if (createdContact.length > 0) {
      const contact = createdContact[0];
      const createdAtDate = new Date(contact.created_at).toISOString().split('T')[0];
      
      if (createdAtDate === customDate) {
        console.log('✅ Test 1 PASSED: Contact created with custom date:', createdAtDate);
      } else {
        console.log('❌ Test 1 FAILED: Expected date:', customDate, 'Got:', createdAtDate);
      }
    } else {
      console.log('❌ Test 1 FAILED: Contact not found');
    }

    // Test 2: Create contact without custom created_at (should use current timestamp)
    console.log('\n🧪 Test 2: Creating contact without custom created_at...');
    
    const testContactId2 = require('crypto').randomUUID();
    
    await connection.execute(
      'INSERT INTO contacts (id, name, email, phone, address, city, state, zip, notes, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [testContactId2, 'Test Contact Default Date', 'test-default@example.com', '555-123-4568', '124 Test St', 'Salt Lake City', 'UT', '84101', 'Test contact with default date', null]
    );

    // Verify the contact was created with current date
    const [createdContact2] = await connection.execute(
      'SELECT id, name, created_at FROM contacts WHERE id = ?',
      [testContactId2]
    );

    if (createdContact2.length > 0) {
      const contact = createdContact2[0];
      const createdAtDate = new Date(contact.created_at).toISOString().split('T')[0];
      const todayDate = new Date().toISOString().split('T')[0];
      
      if (createdAtDate === todayDate) {
        console.log('✅ Test 2 PASSED: Contact created with current date:', createdAtDate);
      } else {
        console.log('❌ Test 2 FAILED: Expected today\'s date:', todayDate, 'Got:', createdAtDate);
      }
    } else {
      console.log('❌ Test 2 FAILED: Contact not found');
    }

    // Test 3: Test date validation (invalid date format)
    console.log('\n🧪 Test 3: Testing date validation...');
    
    const invalidDates = ['2023-13-01', '2023-02-30', 'invalid-date', '23-01-01'];
    
    for (const invalidDate of invalidDates) {
      try {
        const testContactId3 = require('crypto').randomUUID();
        await connection.execute(
          'INSERT INTO contacts (id, name, email, phone, address, city, state, zip, notes, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [testContactId3, 'Test Invalid Date', 'test-invalid@example.com', '555-123-4569', '125 Test St', 'Salt Lake City', 'UT', '84101', 'Test contact with invalid date', null, invalidDate]
        );
        
        console.log('⚠️  Warning: Invalid date accepted by database:', invalidDate);
      } catch (error) {
        console.log('✅ Expected: Invalid date rejected:', invalidDate);
      }
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await connection.execute('DELETE FROM contacts WHERE id IN (?, ?)', [testContactId, testContactId2]);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Contact import date tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testContactImportWithDate();
}

module.exports = { testContactImportWithDate };
