#!/usr/bin/env node

/**
 * Simple migration runner script
 * Supports both SQL (.sql) and JavaScript (.js) migration files
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runSQLMigration(connection, migrationPath) {
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  await connection.execute(migrationSQL);
}

async function runJSMigration(connection, migrationPath) {
  const migration = require(migrationPath);
  if (typeof migration.up === 'function') {
    await migration.up(connection);
  } else {
    throw new Error('JavaScript migration must export an "up" function');
  }
}

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

    const migrationPath = path.join(__dirname, '..', migrationFile);
    const fileExtension = path.extname(migrationFile).toLowerCase();

    console.log(`Running migration: ${migrationFile}`);

    // Execute migration based on file type
    if (fileExtension === '.sql') {
      await runSQLMigration(connection, migrationPath);
    } else if (fileExtension === '.js') {
      await runJSMigration(connection, migrationPath);
    } else {
      throw new Error(`Unsupported migration file type: ${fileExtension}`);
    }

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
