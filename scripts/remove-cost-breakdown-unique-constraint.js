#!/usr/bin/env node

/**
 * Migration script to remove the unique constraint on product_cost_breakdowns table
 * This allows multiple cost breakdown items per category per product
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeUniqueConstraint() {
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

    // Check if the unique constraint exists
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'product_cost_breakdowns' 
        AND CONSTRAINT_TYPE = 'UNIQUE'
        AND CONSTRAINT_NAME = 'unique_product_category'
    `, [process.env.MYSQL_DATABASE || 'payoffsolar']);

    if (constraints.length > 0) {
      console.log('🔧 Removing unique constraint: unique_product_category');
      
      // Drop the unique constraint
      await connection.execute(`
        ALTER TABLE product_cost_breakdowns 
        DROP INDEX unique_product_category
      `);
      
      console.log('✅ Unique constraint removed successfully!');
      console.log('📝 Products can now have multiple cost breakdown items per category');
    } else {
      console.log('ℹ️  Unique constraint does not exist or has already been removed');
    }

  } catch (error) {
    console.error('❌ Error removing unique constraint:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📊 Database connection closed');
    }
  }
}

// Run the migration
removeUniqueConstraint();
