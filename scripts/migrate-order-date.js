#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function runMigration() {
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

    // Check if order_date column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'payoffsolar' 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'order_date'
    `);

    if (columns.length > 0) {
      console.log('order_date column already exists, skipping migration');
      return;
    }

    console.log('Adding order_date column to orders table...');

    // Add the order_date column
    await connection.execute('ALTER TABLE orders ADD COLUMN order_date DATE');
    console.log('✓ Added order_date column');

    // Update existing orders to use created_at date as order_date
    await connection.execute('UPDATE orders SET order_date = DATE(created_at) WHERE order_date IS NULL');
    console.log('✓ Updated existing orders with order_date from created_at');

    // Make order_date NOT NULL after populating existing records
    await connection.execute('ALTER TABLE orders MODIFY COLUMN order_date DATE NOT NULL');
    console.log('✓ Made order_date column NOT NULL');

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
