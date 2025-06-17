#!/usr/bin/env node

/**
 * Database connection test script for Bitnami servers
 * This script helps identify the correct MySQL credentials
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testConnection(config, configName) {
  console.log(`\n🔍 Testing ${configName}:`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Password: ${config.password ? '[SET]' : '[NOT SET]'}`);
  
  try {
    const connection = await mysql.createConnection(config);
    await connection.ping();
    console.log(`   ✅ Connection successful!`);
    
    // Test if we can access the orders table
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM orders');
      console.log(`   ✅ Orders table accessible (${rows[0].count} orders found)`);
      
      // Check for "Followed Up" orders
      const [followedUp] = await connection.execute('SELECT COUNT(*) as count FROM orders WHERE status = "Followed Up"');
      console.log(`   📊 Orders with "Followed Up" status: ${followedUp[0].count}`);
      
    } catch (tableError) {
      console.log(`   ⚠️  Database connected but orders table not accessible: ${tableError.message}`);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔧 Testing database connections...\n');
  
  // Configuration from environment variables
  const envConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar',
    port: parseInt(process.env.MYSQL_PORT || '3306')
  };
  
  // Common Bitnami configurations to try
  const configs = [
    { ...envConfig, name: 'Environment Variables' },
    { ...envConfig, user: 'bitnami', name: 'Bitnami User' },
    { ...envConfig, user: 'root', password: '', name: 'Root No Password' },
    { ...envConfig, user: 'root', password: 'bitnami', name: 'Root with "bitnami" password' },
  ];
  
  let successfulConfig = null;
  
  for (const config of configs) {
    const success = await testConnection(config, config.name);
    if (success && !successfulConfig) {
      successfulConfig = config;
    }
  }
  
  if (successfulConfig) {
    console.log('\n🎉 Found working configuration!');
    console.log('\nUpdate your .env file with:');
    console.log(`MYSQL_HOST=${successfulConfig.host}`);
    console.log(`MYSQL_PORT=${successfulConfig.port}`);
    console.log(`MYSQL_USER=${successfulConfig.user}`);
    console.log(`MYSQL_PASSWORD=${successfulConfig.password}`);
    console.log(`MYSQL_DATABASE=${successfulConfig.database}`);
    console.log('\nThen run the migration script again.');
  } else {
    console.log('\n❌ No working configuration found.');
    console.log('\n💡 Try these commands on your Bitnami server:');
    console.log('   sudo cat /opt/bitnami/mysql/conf/my.cnf');
    console.log('   mysql -u root -p');
    console.log('   mysql -u bitnami -p');
    console.log('\nOr check the Bitnami documentation for MySQL credentials.');
  }
}

main().catch(console.error);
