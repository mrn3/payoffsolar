#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function addTestInventory() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'payoffsolar'
  });

  try {
    console.log('🔍 Finding products and warehouses...');

    // Get all products
    const [products] = await connection.execute(
      'SELECT id, name, sku FROM products WHERE is_active = TRUE ORDER BY name'
    );

    // Get all warehouses
    const [warehouses] = await connection.execute(
      'SELECT id, name FROM warehouses ORDER BY name'
    );

    console.log(`Found ${products.length} products and ${warehouses.length} warehouses`);

    if (products.length === 0 || warehouses.length === 0) {
      console.log('❌ No products or warehouses found. Please run the database initialization first.');
      return;
    }

    // Add inventory for each product in each warehouse
    for (const product of products) {
      for (const warehouse of warehouses) {
        // Check if inventory already exists
        const [existing] = await connection.execute(
          'SELECT id FROM inventory WHERE product_id = ? AND warehouse_id = ?',
          [product.id, warehouse.id]
        );

        if (existing.length === 0) {
          // Generate random quantity between 5 and 50
          const quantity = Math.floor(Math.random() * 46) + 5;
          const minQuantity = Math.floor(quantity * 0.2); // 20% of quantity as minimum

          await connection.execute(
            'INSERT INTO inventory (product_id, warehouse_id, quantity, min_quantity) VALUES (?, ?, ?, ?)',
            [product.id, warehouse.id, quantity, minQuantity]
          );

          console.log(`📦 Added inventory: ${product.name} (${product.sku}) in ${warehouse.name} - Qty: ${quantity}`);
        } else {
          console.log(`✅ Inventory already exists: ${product.name} in ${warehouse.name}`);
        }
      }
    }

    // Show summary
    const [inventorySummary] = await connection.execute(`
      SELECT 
        p.name as product_name,
        p.sku,
        SUM(i.quantity) as total_quantity,
        COUNT(i.id) as warehouse_count
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = TRUE
      GROUP BY p.id, p.name, p.sku
      ORDER BY p.name
    `);

    console.log('\n📊 Inventory Summary:');
    console.log('Product Name | SKU | Total Qty | Warehouses');
    console.log('----------------------------------------');
    for (const item of inventorySummary) {
      console.log(`${item.product_name} | ${item.sku} | ${item.total_quantity || 0} | ${item.warehouse_count || 0}`);
    }

    console.log('\n✅ Test inventory setup complete!');

  } catch (error) {
    console.error('❌ Error adding test inventory:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
addTestInventory().catch(console.error);
