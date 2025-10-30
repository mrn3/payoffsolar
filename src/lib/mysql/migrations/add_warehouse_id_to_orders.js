/**
 * Migration: Add warehouse_id to orders table and FK to warehouses
 * Date: 2025-10-29
 */

const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding warehouse_id to orders table...');

  // Check if warehouse_id column already exists
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'warehouse_id'
  `);

  if (columns.length === 0) {
    await connection.execute(`
      ALTER TABLE orders
      ADD COLUMN warehouse_id VARCHAR(36) NULL AFTER contact_id
    `);
    console.log('✓ Added warehouse_id column to orders table');

    // Add foreign key if not exists (best-effort)
    try {
      await connection.execute(`
        ALTER TABLE orders
        ADD CONSTRAINT fk_orders_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key fk_orders_warehouse');
    } catch (err) {
      if (!String(err.message || '').includes('Duplicate')) {
        console.warn('! Skipped adding foreign key fk_orders_warehouse:', err.message);
      }
    }

    // Add index for warehouse_id
    try {
      await connection.execute(`
        CREATE INDEX idx_orders_warehouse_id ON orders(warehouse_id)
      `);
      console.log('✓ Created index idx_orders_warehouse_id');
    } catch (err) {
      if (!String(err.message || '').includes('exists')) {
        console.warn('! Skipped creating index idx_orders_warehouse_id:', err.message);
      }
    }
  } else {
    console.log('✓ warehouse_id already exists on orders table');
  }
}

async function down(connection) {
  console.log('Removing warehouse_id from orders table...');
  // Drop FK if exists
  try {
    await connection.execute(`
      ALTER TABLE orders DROP FOREIGN KEY fk_orders_warehouse
    `);
    console.log('✓ Dropped foreign key fk_orders_warehouse');
  } catch (err) {
    if (!String(err.message || '').includes("doesn't exist")) {
      console.warn('! Could not drop foreign key fk_orders_warehouse:', err.message);
    }
  }

  // Drop index if exists
  try {
    await connection.execute(`
      DROP INDEX idx_orders_warehouse_id ON orders
    `);
    console.log('✓ Dropped index idx_orders_warehouse_id');
  } catch (err) {
    if (!String(err.message || '').includes("doesn't exist")) {
      console.warn('! Could not drop index idx_orders_warehouse_id:', err.message);
    }
  }

  // Drop column
  try {
    await connection.execute(`
      ALTER TABLE orders DROP COLUMN warehouse_id
    `);
    console.log('✓ Dropped column warehouse_id');
  } catch (err) {
    console.warn('! Could not drop column warehouse_id:', err.message);
  }
}

module.exports = { up, down };

