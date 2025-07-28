#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function createMissingInvoices() {
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

    // Get all orders that don't have invoices
    const [orders] = await connection.execute(`
      SELECT o.id, o.total, o.status, o.order_date, o.created_at
      FROM orders o
      LEFT JOIN invoices i ON o.id = i.order_id
      WHERE i.id IS NULL
      ORDER BY o.created_at ASC
    `);

    console.log(`Found ${orders.length} orders without invoices`);

    if (orders.length === 0) {
      console.log('All orders already have invoices!');
      return;
    }

    // Create invoices for each order
    for (const order of orders) {
      // Generate invoice number with more randomness
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      const orderSuffix = order.id.substring(0, 4);
      const invoiceNumber = `INV-${year}${month}-${timestamp}-${random}-${orderSuffix}`;

      // Set due date (30 days from order date)
      const orderDate = new Date(order.order_date);
      const dueDate = new Date(orderDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Determine status based on order status
      let status = 'pending';
      if (order.status.toLowerCase() === 'paid') {
        status = 'paid';
      } else if (order.status.toLowerCase() === 'completed') {
        status = 'sent';
      }

      // Generate UUID for invoice
      const [uuidResult] = await connection.execute('SELECT UUID() as id');
      const invoiceId = uuidResult[0].id;

      // Create invoice
      await connection.execute(
        'INSERT INTO invoices (id, order_id, invoice_number, amount, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
        [invoiceId, order.id, invoiceNumber, order.total, status, dueDate.toISOString().split('T')[0]]
      );

      console.log(`✅ Created invoice ${invoiceNumber} for order ${order.id.substring(0, 8)}`);
    }

    console.log(`\n🎉 Successfully created ${orders.length} invoices!`);

  } catch (error) {
    console.error('Error creating invoices:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
createMissingInvoices();
