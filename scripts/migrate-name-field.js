#!/usr/bin/env node

/**
 * Migration script to convert first_name and last_name fields to a single name field
 * in the contacts table.
 */

// Load environment variables first
// Try .env.local first (for local development), then .env (for server deployment)
const fs = require('fs');
const path = require('path');

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

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'payoffsolar',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
};

async function migrateNameField() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      console.log('📋 Checking current table structure...');
      
      // Check if the table has the old structure
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'contacts'
        AND COLUMN_NAME IN ('first_name', 'last_name', 'name')
      `, [dbConfig.database]);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      const hasOldStructure = columnNames.includes('first_name') && columnNames.includes('last_name');
      const hasNewStructure = columnNames.includes('name');
      
      if (!hasOldStructure && hasNewStructure) {
        console.log('✅ Table already has the new structure with name field. No migration needed.');
        await connection.rollback();
        return;
      }
      
      if (!hasOldStructure) {
        console.log('❌ Table does not have first_name and last_name fields. Cannot migrate.');
        await connection.rollback();
        return;
      }
      
      console.log('🔄 Adding new name column...');
      await connection.execute(`
        ALTER TABLE contacts 
        ADD COLUMN name VARCHAR(200) NOT NULL DEFAULT '' AFTER id
      `);
      
      console.log('🔄 Migrating data from first_name and last_name to name...');
      await connection.execute(`
        UPDATE contacts 
        SET name = TRIM(CONCAT(
          COALESCE(first_name, ''), 
          CASE 
            WHEN COALESCE(first_name, '') != '' AND COALESCE(last_name, '') != '' THEN ' '
            ELSE ''
          END,
          COALESCE(last_name, '')
        ))
        WHERE name = ''
      `);
      
      // Handle any empty names by setting them to 'Unknown'
      console.log('🔄 Handling empty names...');
      await connection.execute(`
        UPDATE contacts 
        SET name = 'Unknown' 
        WHERE name = '' OR name IS NULL
      `);
      
      console.log('🔄 Dropping old first_name and last_name columns...');
      await connection.execute('ALTER TABLE contacts DROP COLUMN first_name');
      await connection.execute('ALTER TABLE contacts DROP COLUMN last_name');
      
      // Commit transaction
      await connection.commit();
      
      console.log('✅ Migration completed successfully!');
      console.log('📊 Summary:');
      console.log('   - Added new name column');
      console.log('   - Migrated first_name + last_name data to name field');
      console.log('   - Dropped old first_name and last_name columns');
      
    } catch (error) {
      console.error('❌ Error during migration, rolling back...');
      await connection.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateNameField();
}

module.exports = { migrateNameField };
