#!/usr/bin/env node

/**
 * Script to add sample data for testing
 * Run with: node scripts/add-sample-data.js
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function addSampleData() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'payoffsolar',
      port: process.env.MYSQL_PORT || 3306
    });

    console.log('📊 Connected to MySQL database');

    // Create a customer user first
    const customerEmail = 'customer@example.com';
    const customerPassword = 'customer123';
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(customerPassword, 12);

    // Get customer role ID
    const [customerRoles] = await connection.execute(
      'SELECT id FROM roles WHERE name = ?',
      ['customer']
    );

    if (customerRoles.length === 0) {
      console.log('❌ Customer role not found');
      return;
    }

    const customerRoleId = customerRoles[0].id;

    // Check if customer user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [customerEmail]
    );

    let customerId;
    if (existingUsers.length === 0) {
      // Create customer user
      const [uuidResult] = await connection.execute('SELECT UUID() as id');
      customerId = uuidResult[0].id;

      await connection.execute(
        'INSERT INTO users (id, email, password_hash, email_verified) VALUES (?, ?, ?, TRUE)',
        [customerId, customerEmail, passwordHash]
      );

      // Create profile
      await connection.execute(
        'INSERT INTO profiles (id, first_name, last_name, email, role_id) VALUES (?, ?, ?, ?, ?)',
        [customerId, 'John', 'Customer', customerEmail, customerRoleId]
      );

      console.log('👤 Customer user created:', customerEmail);
    } else {
      customerId = existingUsers[0].id;
      console.log('👤 Customer user already exists:', customerEmail);
    }

    // Create a customer record
    const [customerUuidResult] = await connection.execute('SELECT UUID() as id');
    const customerRecordId = customerUuidResult[0].id;

    // Check if customer record exists
    const [existingCustomers] = await connection.execute(
      'SELECT id FROM customers WHERE email = ?',
      [customerEmail]
    );

    if (existingCustomers.length === 0) {
      await connection.execute(
        `INSERT INTO customers (id, first_name, last_name, email, phone, address, city, state, zip, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customerRecordId, 'John', 'Customer', customerEmail, '555-123-4567', '123 Main St', 'Anytown', 'CA', '12345', customerId]
      );
      console.log('📝 Customer record created');
    } else {
      console.log('📝 Customer record already exists');
    }

    // Create sample orders
    const orders = [
      { total: 1500.00, status: 'completed', notes: 'Solar panel installation' },
      { total: 2500.00, status: 'pending', notes: 'Battery system upgrade' },
      { total: 800.00, status: 'processing', notes: 'Maintenance service' }
    ];

    for (const order of orders) {
      const [orderUuidResult] = await connection.execute('SELECT UUID() as id');
      const orderId = orderUuidResult[0].id;

      await connection.execute(
        'INSERT INTO orders (id, customer_id, status, total, notes) VALUES (?, ?, ?, ?, ?)',
        [orderId, customerRecordId, order.status, order.total, order.notes]
      );

      // Create corresponding invoice
      const [invoiceUuidResult] = await connection.execute('SELECT UUID() as id');
      const invoiceId = invoiceUuidResult[0].id;
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const invoiceStatus = order.status === 'completed' ? 'paid' : 'pending';
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      await connection.execute(
        'INSERT INTO invoices (id, order_id, invoice_number, amount, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
        [invoiceId, orderId, invoiceNumber, order.total, invoiceStatus, dueDate.toISOString().split('T')[0]]
      );

      console.log(`📄 Created order ${orderId.substring(0, 8)} and invoice ${invoiceNumber}`);
    }

    // Create some products
    const products = [
      { name: 'Solar Panel 300W', description: 'High efficiency solar panel', price: 299.99, sku: 'SP-300W' },
      { name: 'Battery Pack 10kWh', description: 'Lithium ion battery storage', price: 4999.99, sku: 'BP-10KWH' },
      { name: 'Inverter 5kW', description: 'Grid-tie inverter', price: 1299.99, sku: 'INV-5KW' }
    ];

    for (const product of products) {
      const [productUuidResult] = await connection.execute('SELECT UUID() as id');
      const productId = productUuidResult[0].id;

      await connection.execute(
        'INSERT INTO products (id, name, description, price, sku) VALUES (?, ?, ?, ?, ?)',
        [productId, product.name, product.description, product.price, product.sku]
      );

      console.log(`📦 Created product: ${product.name}`);
    }

    console.log('✅ Sample data created successfully!');
    console.log('🔑 Customer login: customer@example.com / customer123');
    console.log('🔑 Admin login: matt@payoffsolar.com / admin123');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📊 Database connection closed');
    }
  }
}

// Run the script
addSampleData();
