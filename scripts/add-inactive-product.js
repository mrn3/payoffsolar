const mysql = require('mysql2/promise');

async function addInactiveProduct() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'payoffsolar'
  });

  try {
    // Add an inactive product for testing
    const [result] = await connection.execute(`
      INSERT INTO products (id, name, description, price, sku, is_active) 
      VALUES (UUID(), 'Discontinued Solar Panel 250W', 'Old model solar panel - no longer available', 199.99, 'DSP-250W', FALSE)
    `);

    console.log('✅ Added inactive product for testing');

    // Also add another inactive product
    await connection.execute(`
      INSERT INTO products (id, name, description, price, sku, is_active) 
      VALUES (UUID(), 'Legacy Inverter 3kW', 'Legacy inverter model - discontinued', 799.99, 'LI-3KW', FALSE)
    `);

    console.log('✅ Added second inactive product for testing');

  } catch (error) {
    console.error('Error adding inactive products:', error);
  } finally {
    await connection.end();
  }
}

addInactiveProduct();
