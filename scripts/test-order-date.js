#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function testOrderDate() {
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

    // Check if order_date column exists and has data
    const [orders] = await connection.execute(`
      SELECT id, contact_id, status, total, order_date, created_at 
      FROM orders 
      LIMIT 5
    `);

    console.log('\nSample orders with order_date:');
    console.log('ID\t\tStatus\t\tTotal\t\tOrder Date\tCreated At');
    console.log('-------------------------------------------------------------------');
    
    orders.forEach(order => {
      console.log(`${order.id.substring(0, 8)}\t${order.status}\t\t$${order.total}\t\t${order.order_date}\t${order.created_at.toISOString().split('T')[0]}`);
    });

    // Test that all orders have order_date
    const [nullOrderDates] = await connection.execute(`
      SELECT COUNT(*) as count FROM orders WHERE order_date IS NULL
    `);

    console.log(`\nOrders with NULL order_date: ${nullOrderDates[0].count}`);

    if (nullOrderDates[0].count === 0) {
      console.log('✅ All orders have order_date values');
    } else {
      console.log('❌ Some orders are missing order_date values');
    }

    console.log('\nOrder date migration test completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testOrderDate();
