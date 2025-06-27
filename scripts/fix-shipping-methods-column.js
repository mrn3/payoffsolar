#!/usr/bin/env node

/**
 * Fix missing shipping_methods column on server
 * This script checks if the column exists and adds it if missing
 */

// Load environment variables
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

async function checkAndFixShippingMethodsColumn() {
  let connection;
  
  try {
    console.log('🔧 Connecting to database...');
    console.log('🔍 Environment variables:');
    console.log('  MYSQL_HOST:', process.env.MYSQL_HOST || 'localhost');
    console.log('  MYSQL_PORT:', process.env.MYSQL_PORT || 3306);
    console.log('  MYSQL_USER:', process.env.MYSQL_USER || 'root');
    console.log('  MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***' : 'NOT SET');
    console.log('  MYSQL_DATABASE:', process.env.MYSQL_DATABASE || 'payoffsolar');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Check if shipping_methods column exists
    console.log('🔍 Checking if shipping_methods column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'shipping_methods'
    `);
    
    if (columns.length === 0) {
      console.log('❌ shipping_methods column is missing');
      console.log('🔧 Adding shipping_methods column...');
      
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN shipping_methods JSON AFTER tax_percentage
      `);
      
      console.log('✅ Added shipping_methods column to products table');
    } else {
      console.log('✅ shipping_methods column already exists');
    }
    
    // Verify the column exists now
    console.log('🔍 Verifying products table schema...');
    const [allColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Products table columns:');
    allColumns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${nullable}`);
    });
    
    // Test a simple update to make sure it works
    console.log('🧪 Testing product update...');
    const [products] = await connection.execute('SELECT id FROM products LIMIT 1');
    
    if (products.length > 0) {
      const productId = products[0].id;
      await connection.execute(
        'UPDATE products SET shipping_methods = ? WHERE id = ?',
        [JSON.stringify([]), productId]
      );
      console.log('✅ Product update test successful');
    } else {
      console.log('⚠️  No products found to test update');
    }
    
    console.log('🎉 shipping_methods column fix completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndFixShippingMethodsColumn();
