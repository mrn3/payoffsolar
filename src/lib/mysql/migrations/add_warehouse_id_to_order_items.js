/**
 * Migration: Add warehouse_id to order_items table and FK to warehouses
 * Date: 2025-10-30
 */

const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding warehouse_id to order_items table...');

  // Check if warehouse_id column already exists
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'order_items'
      AND COLUMN_NAME = 'warehouse_id'
  `);

  if (columns.length === 0) {
    await connection.execute(`
      ALTER TABLE order_items
      ADD COLUMN warehouse_id VARCHAR(36) NULL AFTER product_id
    `);
    console.log('✓ Added warehouse_id column to order_items table');

    // Add foreign key if not exists (best-effort)
    try {
      await connection.execute(`
        ALTER TABLE order_items
        ADD CONSTRAINT fk_order_items_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key fk_order_items_warehouse');
    } catch (err) {
      if (!String(err.message || '').includes('Duplicate')) {
        console.warn('! Skipped adding foreign key fk_order_items_warehouse:', err.message);
      }
    }

    // Add index for warehouse_id
    try {
      await connection.execute(`
        CREATE INDEX idx_order_items_warehouse_id ON order_items(warehouse_id)
      `);
      console.log('✓ Created index idx_order_items_warehouse_id');
    } catch (err) {
      if (!String(err.message || '').includes('exists')) {
        console.warn('! Skipped creating index idx_order_items_warehouse_id:', err.message);
      }
    }
  } else {
    console.log('✓ warehouse_id already exists on order_items table');
  }
}

async function down(connection) {
  console.log('Removing warehouse_id from order_items table...');
  // Drop FK if exists
  try {
    await connection.execute(`
      ALTER TABLE order_items DROP FOREIGN KEY fk_order_items_warehouse
    `);
    console.log('✓ Dropped foreign key fk_order_items_warehouse');
  } catch (err) {
    if (!String(err.message || '').includes("doesn't exist")) {
      console.warn('! Could not drop foreign key fk_order_items_warehouse:', err.message);
    }
  }

  // Drop index if exists
  try {
    await connection.execute(`
      DROP INDEX idx_order_items_warehouse_id ON order_items
    `);
    console.log('✓ Dropped index idx_order_items_warehouse_id');
  } catch (err) {
    if (!String(err.message || '').includes("doesn't exist")) {
      console.warn('! Could not drop index idx_order_items_warehouse_id:', err.message);
    }
  }

  // Drop column
  try {
    await connection.execute(`
      ALTER TABLE order_items DROP COLUMN warehouse_id
    `);
    console.log('✓ Dropped column warehouse_id');
  } catch (err) {
    console.warn('! Could not drop column warehouse_id:', err.message);
  }
}

module.exports = { up, down };

