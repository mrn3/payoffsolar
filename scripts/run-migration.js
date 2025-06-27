#!/usr/bin/env node

/**
 * Simple migration runner script
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration(migrationFile) {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'payoffsolar',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Running migration: ${migrationFile}`);
    
    // Execute migration
    await connection.execute(migrationSQL);
    
    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node run-migration.js <migration-file>');
  console.error('Example: node run-migration.js src/lib/mysql/migrations/add_slug_to_products.sql');
  process.exit(1);
}

runMigration(migrationFile).catch(console.error);
