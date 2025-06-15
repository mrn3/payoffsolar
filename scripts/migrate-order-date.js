#!/usr/bin/env node

// Load environment variables first
// Try .env.local first (for local development), then .env (for server deployment)
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
  console.log('📄 Loaded environment from .env.local');
} else if (fs.existsSync('.env')) {
  require('dotenv').config({ path: '.env' });
  console.log('📄 Loaded environment from .env');
} else {
  console.log('⚠️  No .env.local or .env file found, using system environment variables');
}

const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;

  try {
    console.log('🔍 Environment variables loaded:');
    console.log('  MYSQL_HOST:', process.env.MYSQL_HOST || 'localhost');
    console.log('  MYSQL_PORT:', process.env.MYSQL_PORT || 3306);
    console.log('  MYSQL_USER:', process.env.MYSQL_USER || 'root');
    console.log('  MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***' : 'NOT SET');
    console.log('  MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'payoffsolar');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar'
    });

    console.log('Connected to MySQL database');

    // Check if order_date column already exists
    const dbName = process.env.MYSQL_DATABASE || 'payoffsolar';
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'order_date'
    `, [dbName]);

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
