#!/usr/bin/env node

/**
 * Migration script to remove "Followed Up" status from orders
 * This script will:
 * 1. Update all orders with "Followed Up" status to "Complete"
 * 2. Show before/after statistics
 */

// Load environment variables from multiple possible files
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

// Database configuration with better defaults for Bitnami
const dbConfig = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'payoffsolar',
  port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306')
};

console.log('🔧 Database configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   Password: ${dbConfig.password ? '[SET]' : '[NOT SET]'}`);
console.log('');

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Get current status counts before migration
    console.log('\n📊 Current order status distribution:');
    const [beforeStats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      GROUP BY status 
      ORDER BY status
    `);
    
    beforeStats.forEach(row => {
      console.log(`   ${row.status}: ${row.count} orders`);
    });
    
    // Check specifically for "Followed Up" orders
    const [followedUpOrders] = await connection.execute(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'Followed Up'
    `);
    
    const followedUpCount = followedUpOrders[0].count;
    console.log(`\n🎯 Found ${followedUpCount} orders with "Followed Up" status`);
    
    if (followedUpCount === 0) {
      console.log('✅ No orders with "Followed Up" status found. Migration not needed.');
      return;
    }
    
    // Confirm migration
    console.log(`\n⚠️  This will update ${followedUpCount} orders from "Followed Up" to "Complete"`);
    console.log('Press Ctrl+C to cancel, or press Enter to continue...');
    
    // Wait for user input (in a real script, you might want to use readline)
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('\n🔄 Running migration...');
    
    // Execute the migration
    const [updateResult] = await connection.execute(`
      UPDATE orders SET status = 'Complete' WHERE status = 'Followed Up'
    `);
    
    console.log(`✅ Updated ${updateResult.affectedRows} orders`);
    
    // Get status counts after migration
    console.log('\n📊 Order status distribution after migration:');
    const [afterStats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      GROUP BY status 
      ORDER BY status
    `);
    
    afterStats.forEach(row => {
      console.log(`   ${row.status}: ${row.count} orders`);
    });
    
    // Verify no "Followed Up" orders remain
    const [verifyResult] = await connection.execute(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'Followed Up'
    `);
    
    if (verifyResult[0].count === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   All "Followed Up" orders have been updated to "Complete"');
    } else {
      console.log(`\n❌ Migration incomplete. ${verifyResult[0].count} "Followed Up" orders still remain.`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Database connection tips for Bitnami servers:');
      console.error('   1. Check if MySQL password is set correctly in .env file');
      console.error('   2. On Bitnami, try using the bitnami user instead of root');
      console.error('   3. Check MySQL credentials with: sudo cat /opt/bitnami/mysql/conf/my.cnf');
      console.error('   4. Or try: mysql -u root -p (to test connection manually)');
      console.error('\n   Example .env configuration for Bitnami:');
      console.error('   MYSQL_HOST=localhost');
      console.error('   MYSQL_USER=root');
      console.error('   MYSQL_PASSWORD=your_actual_mysql_password');
      console.error('   MYSQL_DATABASE=payoffsolar');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
runMigration().catch(console.error);
