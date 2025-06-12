#!/usr/bin/env node

/**
 * Migration script to rename customers table to contacts
 * and update all related references
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'payoffsolar',
  port: process.env.MYSQL_PORT || 3306
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔄 Starting migration: customers → contacts');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // 1. Check if customers table exists
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'customers'"
      );
      
      if (tables.length === 0) {
        console.log('ℹ️  Customers table does not exist, skipping migration');
        await connection.commit();
        return;
      }
      
      // 2. Check if contacts table already exists
      const [contactsTables] = await connection.execute(
        "SHOW TABLES LIKE 'contacts'"
      );
      
      if (contactsTables.length > 0) {
        console.log('ℹ️  Contacts table already exists, skipping migration');
        await connection.commit();
        return;
      }
      
      console.log('📋 Renaming customers table to contacts...');
      await connection.execute('RENAME TABLE customers TO contacts');
      
      console.log('🔄 Updating orders table to use contact_id...');
      
      // Add new contact_id column
      await connection.execute(`
        ALTER TABLE orders 
        ADD COLUMN contact_id VARCHAR(36) AFTER id
      `);
      
      // Copy data from customer_id to contact_id
      await connection.execute(`
        UPDATE orders 
        SET contact_id = customer_id 
        WHERE customer_id IS NOT NULL
      `);
      
      // Drop the foreign key constraint on customer_id
      const [fkConstraints] = await connection.execute(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = 'customer_id' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [dbConfig.database]);
      
      if (fkConstraints.length > 0) {
        const constraintName = fkConstraints[0].CONSTRAINT_NAME;
        console.log(`🔄 Dropping foreign key constraint: ${constraintName}`);
        await connection.execute(`ALTER TABLE orders DROP FOREIGN KEY ${constraintName}`);
      }
      
      // Drop customer_id column
      await connection.execute('ALTER TABLE orders DROP COLUMN customer_id');
      
      // Add foreign key constraint for contact_id
      console.log('🔄 Adding foreign key constraint for contact_id...');
      await connection.execute(`
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_contact_id 
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      `);
      
      // Update indexes
      console.log('🔄 Updating indexes...');
      
      // Drop old customer indexes if they exist
      try {
        await connection.execute('DROP INDEX idx_customers_email ON contacts');
      } catch (e) {
        // Index might not exist, that's ok
      }
      
      try {
        await connection.execute('DROP INDEX idx_orders_customer ON orders');
      } catch (e) {
        // Index might not exist, that's ok
      }
      
      // Create new contact indexes
      await connection.execute('CREATE INDEX idx_contacts_email ON contacts(email)');
      await connection.execute('CREATE INDEX idx_orders_contact ON orders(contact_id)');
      
      // Update roles table
      console.log('🔄 Updating roles table...');
      await connection.execute(`
        UPDATE roles 
        SET name = 'contact', description = 'Contact with access to their own orders' 
        WHERE name = 'customer'
      `);
      
      // Update any existing user profiles with customer role
      console.log('🔄 Updating user profiles...');
      const [customerRoleId] = await connection.execute(`
        SELECT id FROM roles WHERE name = 'contact'
      `);
      
      if (customerRoleId.length > 0) {
        await connection.execute(`
          UPDATE profiles 
          SET role_id = ? 
          WHERE role_id IN (
            SELECT id FROM (
              SELECT id FROM roles WHERE name = 'customer'
            ) AS temp
          )
        `, [customerRoleId[0].id]);
      }
      
      // Commit transaction
      await connection.commit();
      
      console.log('✅ Migration completed successfully!');
      console.log('📊 Summary:');
      console.log('   - Renamed customers table to contacts');
      console.log('   - Updated orders.customer_id to orders.contact_id');
      console.log('   - Updated foreign key constraints');
      console.log('   - Updated indexes');
      console.log('   - Updated roles from "customer" to "contact"');
      console.log('   - Updated user profiles');
      
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

// Run migration
runMigration().then(() => {
  console.log('🎉 Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});
