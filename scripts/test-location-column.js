const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testLocationColumn() {
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

    // Check if there are any contacts with location data
    const [existingContacts] = await connection.execute(
      'SELECT id, name, city, state FROM contacts WHERE city IS NOT NULL AND city != "" LIMIT 5'
    );

    console.log('Existing contacts with location data:', existingContacts);

    // If no contacts with location data, create a test contact
    if (existingContacts.length === 0) {
      console.log('Creating test contact with location data...');
      
      const contactId = require('crypto').randomUUID();
      await connection.execute(
        'INSERT INTO contacts (id, name, email, phone, address, city, state, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [contactId, 'Test Customer', 'test@example.com', '555-123-4567', '123 Test St', 'Salt Lake City', 'UT', '84101']
      );

      console.log('Created test contact:', contactId);

      // Create a test order for this contact
      const orderId = require('crypto').randomUUID();
      await connection.execute(
        'INSERT INTO orders (id, contact_id, status, total, order_date) VALUES (?, ?, ?, ?, ?)',
        [orderId, contactId, 'proposed', 1000.00, new Date().toISOString().split('T')[0]]
      );

      console.log('Created test order:', orderId);
    }

    // Query orders with contact location data
    const [orders] = await connection.execute(`
      SELECT o.id, o.status, o.total, o.order_date, 
             c.name as contact_name, c.city as contact_city, c.state as contact_state
      FROM orders o
      LEFT JOIN contacts c ON o.contact_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    console.log('\nOrders with location data:');
    orders.forEach(order => {
      const location = [order.contact_city, order.contact_state].filter(Boolean).join(', ') || '-';
      console.log(`Order ${order.id.substring(0, 8)}: ${order.contact_name} (${location}) - $${order.total}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testLocationColumn();
