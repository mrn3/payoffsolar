/**
 * Migration: Add product bundle support
 * Date: 2025-07-19
 * Description: Adds bundle functionality to products including bundle metadata and component relationships
 */

const mysql = require('mysql2/promise');

async function up(connection) {
  console.log('Adding product bundle support...');
  
  // Add bundle-related columns to products table
  console.log('Adding bundle columns to products table...');
  
  // Check if is_bundle column already exists
  const [bundleColumns] = await connection.execute(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND COLUMN_NAME = 'is_bundle'
  `);
  
  if (bundleColumns.length === 0) {
    await connection.execute(`
      ALTER TABLE products 
      ADD COLUMN is_bundle BOOLEAN DEFAULT FALSE AFTER shipping_methods,
      ADD COLUMN bundle_pricing_type ENUM('calculated', 'fixed') DEFAULT 'calculated' AFTER is_bundle,
      ADD COLUMN bundle_discount_percentage DECIMAL(5, 2) DEFAULT 0.00 AFTER bundle_pricing_type
    `);
    console.log('✓ Added bundle columns to products table');
  } else {
    console.log('✓ Bundle columns already exist in products table');
  }
  
  // Create product_bundle_items table
  console.log('Creating product_bundle_items table...');
  
  const [bundleItemsTables] = await connection.execute(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'product_bundle_items'
  `);
  
  if (bundleItemsTables.length === 0) {
    await connection.execute(`
      CREATE TABLE product_bundle_items (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        bundle_product_id VARCHAR(36) NOT NULL,
        component_product_id VARCHAR(36) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bundle_product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (component_product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_bundle_component (bundle_product_id, component_product_id)
      )
    `);
    console.log('✓ Created product_bundle_items table');
  } else {
    console.log('✓ product_bundle_items table already exists');
  }
  
  // Add indexes
  console.log('Adding indexes for bundle tables...');
  
  const indexes = [
    {
      name: 'idx_products_is_bundle',
      table: 'products',
      columns: 'is_bundle',
      query: 'CREATE INDEX idx_products_is_bundle ON products(is_bundle)'
    },
    {
      name: 'idx_product_bundle_items_bundle',
      table: 'product_bundle_items',
      columns: 'bundle_product_id',
      query: 'CREATE INDEX idx_product_bundle_items_bundle ON product_bundle_items(bundle_product_id)'
    },
    {
      name: 'idx_product_bundle_items_component',
      table: 'product_bundle_items',
      columns: 'component_product_id',
      query: 'CREATE INDEX idx_product_bundle_items_component ON product_bundle_items(component_product_id)'
    }
  ];
  
  for (const index of indexes) {
    const [existingIndexes] = await connection.execute(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = '${index.table}' 
      AND INDEX_NAME = '${index.name}'
    `);
    
    if (existingIndexes.length === 0) {
      await connection.execute(index.query);
      console.log(`✓ Created index ${index.name}`);
    } else {
      console.log(`✓ Index ${index.name} already exists`);
    }
  }
  
  console.log('✓ Product bundle support migration completed');
}

async function down(connection) {
  console.log('Removing product bundle support...');
  
  // Drop indexes
  console.log('Dropping bundle indexes...');
  const indexes = ['idx_products_is_bundle', 'idx_product_bundle_items_bundle', 'idx_product_bundle_items_component'];
  
  for (const indexName of indexes) {
    try {
      await connection.execute(`DROP INDEX ${indexName} ON products`);
      console.log(`✓ Dropped index ${indexName}`);
    } catch (error) {
      if (!error.message.includes("doesn't exist")) {
        console.log(`! Error dropping index ${indexName}:`, error.message);
      }
    }
  }
  
  // Drop product_bundle_items table
  console.log('Dropping product_bundle_items table...');
  const [bundleItemsTables] = await connection.execute(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'product_bundle_items'
  `);
  
  if (bundleItemsTables.length > 0) {
    await connection.execute('DROP TABLE product_bundle_items');
    console.log('✓ Dropped product_bundle_items table');
  } else {
    console.log('✓ product_bundle_items table does not exist');
  }
  
  // Remove bundle columns from products table
  console.log('Removing bundle columns from products table...');
  const bundleColumns = ['bundle_discount_percentage', 'bundle_pricing_type', 'is_bundle'];
  
  for (const column of bundleColumns) {
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = '${column}'
    `);
    
    if (columns.length > 0) {
      await connection.execute(`ALTER TABLE products DROP COLUMN ${column}`);
      console.log(`✓ Removed ${column} column from products table`);
    } else {
      console.log(`✓ ${column} column does not exist in products table`);
    }
  }
  
  console.log('✓ Product bundle support rollback completed');
}

module.exports = { up, down };
