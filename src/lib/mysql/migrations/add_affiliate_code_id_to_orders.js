/**
 * Migration: Add affiliate_code_id to orders table and FK to affiliate_codes
 * Date: 2025-11-15
 */


async function up(connection) {
  console.log('Adding affiliate_code_id to orders table...');

  // Check if affiliate_code_id column already exists
  const [columns] = await connection.execute(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME = 'affiliate_code_id'
  `);

  if (columns.length === 0) {
    await connection.execute(`
      ALTER TABLE orders
      ADD COLUMN affiliate_code_id VARCHAR(36) NULL AFTER status
    `);
    console.log('✓ Added affiliate_code_id column to orders table');

    // Add foreign key if not exists (best-effort)
    try {
      await connection.execute(`
        ALTER TABLE orders
        ADD CONSTRAINT fk_orders_affiliate_code
        FOREIGN KEY (affiliate_code_id) REFERENCES affiliate_codes(id)
        ON DELETE SET NULL
      `);
      console.log('✓ Added foreign key fk_orders_affiliate_code');
    } catch (err) {
      if (!String(err.message || '').includes('Duplicate')) {
        console.warn('! Skipped adding foreign key fk_orders_affiliate_code:', err.message);
      }
    }

    // Add index for affiliate_code_id
    try {
      await connection.execute(`
        CREATE INDEX idx_orders_affiliate_code_id ON orders(affiliate_code_id)
      `);
      console.log('✓ Created index idx_orders_affiliate_code_id');
    } catch (err) {
      if (!String(err.message || '').includes('exists')) {
        console.warn('! Skipped creating index idx_orders_affiliate_code_id:', err.message);
      }
    }
  } else {
    console.log('✓ affiliate_code_id already exists on orders table');
  }
}

async function down(connection) {
  console.log('Removing affiliate_code_id from orders table...');

  // Drop FK if exists
  try {
    await connection.execute(`
      ALTER TABLE orders DROP FOREIGN KEY fk_orders_affiliate_code
    `);
    console.log('✓ Dropped foreign key fk_orders_affiliate_code');
  } catch (err) {
    if (!String(err.message || '').includes("doesn't exist")) {
      console.warn('! Could not drop foreign key fk_orders_affiliate_code:', err.message);
    }
  }

  // Drop index if exists
  try {
    await connection.execute(`
      DROP INDEX idx_orders_affiliate_code_id ON orders
    `);
    console.log('✓ Dropped index idx_orders_affiliate_code_id');
  } catch (err) {
    if (!String(err.message || '').includes("doesn't exist")) {
      console.warn('! Could not drop index idx_orders_affiliate_code_id:', err.message);
    }
  }

  // Drop column
  try {
    await connection.execute(`
      ALTER TABLE orders DROP COLUMN affiliate_code_id
    `);
    console.log('✓ Dropped column affiliate_code_id');
  } catch (err) {
    console.warn('! Could not drop column affiliate_code_id:', err.message);
  }
}

module.exports = { up, down };

