#!/usr/bin/env node

/**
 * Database Connection Test
 * 
 * This script tests the database connection and verifies the Facebook tables exist.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if it exists
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and Facebook tables...\n');
  
  // Load environment variables
  loadEnvFile();
  
  // Database configuration
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  };

  console.log('🔧 Database config:', {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password ? '***' : 'NOT SET',
    database: config.database
  });

  let connection;
  try {
    // Test connection
    console.log('\n1️⃣ Testing database connection...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully');
    
    // Test basic query
    console.log('\n2️⃣ Testing basic query...');
    const [basicResult] = await connection.execute('SELECT 1 as test');
    console.log('✅ Basic query successful:', basicResult[0]);
    
    // Check if contacts table exists (should exist)
    console.log('\n3️⃣ Checking contacts table...');
    const [contactsCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'contacts'
    `);
    
    if (contactsCheck[0].count > 0) {
      console.log('✅ Contacts table exists');
    } else {
      console.log('❌ Contacts table missing');
    }
    
    // Check Facebook tables
    console.log('\n4️⃣ Checking Facebook tables...');
    const [facebookTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('facebook_conversations', 'facebook_messages')
      ORDER BY TABLE_NAME
    `);
    
    console.log('📊 Found Facebook tables:', facebookTables.map(t => t.TABLE_NAME));
    
    if (facebookTables.length === 2) {
      console.log('✅ Both Facebook tables exist');
      
      // Test queries on Facebook tables
      console.log('\n5️⃣ Testing Facebook table queries...');
      
      const [conversationCount] = await connection.execute('SELECT COUNT(*) as count FROM facebook_conversations');
      console.log('✅ facebook_conversations query successful, count:', conversationCount[0].count);
      
      const [messageCount] = await connection.execute('SELECT COUNT(*) as count FROM facebook_messages');
      console.log('✅ facebook_messages query successful, count:', messageCount[0].count);
      
    } else {
      console.log('❌ Facebook tables missing:', 2 - facebookTables.length, 'tables not found');
    }
    
    // Check facebook_user_id column in contacts
    console.log('\n6️⃣ Checking facebook_user_id column...');
    const [columnCheck] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'contacts' 
      AND COLUMN_NAME = 'facebook_user_id'
    `);
    
    if (columnCheck.length > 0) {
      console.log('✅ facebook_user_id column exists in contacts table');
    } else {
      console.log('❌ facebook_user_id column missing from contacts table');
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

testDatabaseConnection();
