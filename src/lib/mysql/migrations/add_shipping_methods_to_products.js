/**
 * Migration: Add shipping_methods column to products table
 * Date: 2025-06-27
 * Description: Adds a JSON column to store shipping method configurations for each product
 */

const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding shipping_methods column to products table...');
  
  // Check if column already exists
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND COLUMN_NAME = 'shipping_methods'
  `);
  
  if (columns.length === 0) {
    await connection.execute(`
      ALTER TABLE products 
      ADD COLUMN shipping_methods JSON AFTER tax_percentage
    `);
    console.log('✓ Added shipping_methods column to products table');
  } else {
    console.log('✓ shipping_methods column already exists in products table');
  }
}

async function down(connection) {
  console.log('Removing shipping_methods column from products table...');
  
  // Check if column exists
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND COLUMN_NAME = 'shipping_methods'
  `);
  
  if (columns.length > 0) {
    await connection.execute(`
      ALTER TABLE products 
      DROP COLUMN shipping_methods
    `);
    console.log('✓ Removed shipping_methods column from products table');
  } else {
    console.log('✓ shipping_methods column does not exist in products table');
  }
}

module.exports = { up, down };
